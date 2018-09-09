import { extractNodeAttributes, extractNodeContents } from "./dom_walker";
import {
  extractExpression,
  stripNegationPrefixes,
  removePrimitiveExpressions,
  removeObserverPostfixes
} from "./expression_extractor";
import { AliasMap, AST_NODE, EXPRESSION, MAIN_AST_NODE_TYPE } from "./types";
import {
  isExpressionFunction,
  getFunctionArguments,
  getFunctionName,
  isDomRepeat
} from "./utils";

const FUNCTION_LIST_ACCESS_MATCHER = /(.*)\(\)\[\]$/;
const ON_BINDING_ATTR_MATCHER = /^on\-.*$/;

function expressionsToAstNodes(expressions: string[]) {
  return expressions.reduce((accum: AST_NODE[], expression) => {
    accum.push(...expressionToAstNodes(expression));
    return accum;
  }, []);
}

/**
 *
 * turns a.b(c.z).g
 * into
 * [a, b(c.z), g]
 */
export function splitExpressionOnOuterPeriods(expression: string) {
  let accum = "";
  const ret: string[] = [];
  let parenLevel = 0;

  for (const char of expression.split("")) {
    if (char === "(") {
      parenLevel++;
    }

    if (char === ")") {
      parenLevel--;
    }

    if (char === "." && parenLevel === 0) {
      if (accum.length) {
        ret.push(accum);
        accum = "";
      }
    } else {
      accum += char;
    }
  }

  if (parenLevel !== 0) {
    throw new Error(`Unbalenced parens detected in expression ${expression}`);
  }

  if (accum.length) {
    ret.push(accum);
  }

  return ret;
}

export function functionExpressionToAstNodes(
  expression: string,
  knownType: MAIN_AST_NODE_TYPE = EXPRESSION.VALUE
) {
  const expressions = [];
  const functionName = getFunctionName(expression);
  const functionArguments = getFunctionArguments(expression);

  if (functionName != null) {
    if (functionName.indexOf(".") !== -1) {
      expressions.push(
        ...dotExpressionToNestedExpression(functionName, EXPRESSION.FUNCTION, {
          argumentCount: functionArguments.length,
          returnType: knownType
        })
      );
    } else {
      expressions.push({
        expression: functionName,
        type: EXPRESSION.FUNCTION as EXPRESSION.FUNCTION,
        argumentCount: functionArguments.length,
        returnType: knownType
      });
    }
  }

  for (const argumentExpression of stripNegationPrefixes(
    removeObserverPostfixes(removePrimitiveExpressions(functionArguments))
  )) {
    expressions.push(...expressionToAstNodes(argumentExpression));
  }

  return expressions;
}

function dotExpressionToNestedExpression(
  expression: string,
  knownType: MAIN_AST_NODE_TYPE = EXPRESSION.VALUE,
  opts?: { argumentCount?: number; returnType?: EXPRESSION }
) {
  const additionalNodes: AST_NODE[] = [];
  const rootExpressionString = splitExpressionOnOuterPeriods(expression)[0];
  const rootExpressions = expressionToAstNodes(rootExpressionString);
  additionalNodes.push(...rootExpressions.slice(1));

  const root = rootExpressions[0];
  root.children = {};

  const tailExpression = splitExpressionOnOuterPeriods(expression)
    .slice(1)
    .reduce((prev, curr) => {
      const currentExpressions = expressionToAstNodes(curr);
      prev.children![currentExpressions[0].expression] = Object.assign(
        { children: {} },
        currentExpressions[0]
      );
      additionalNodes.push(...currentExpressions.slice(1));

      return prev.children![currentExpressions[0].expression];
    }, root);

  tailExpression.type = knownType;

  if (opts && opts.argumentCount !== undefined) {
    tailExpression.argumentCount = opts.argumentCount;
  }

  if (opts && opts.returnType !== undefined) {
    tailExpression.returnType = opts.returnType;
  }

  return [root, ...additionalNodes];
}

function expressionToAstNodes(
  expression: string,
  knownType: MAIN_AST_NODE_TYPE = EXPRESSION.VALUE
): AST_NODE[] {
  const expressions: AST_NODE[] = [];

  if (isExpressionFunction(expression)) {
    expressions.push(...functionExpressionToAstNodes(expression, knownType));
  } else if (expression.match(FUNCTION_LIST_ACCESS_MATCHER)) {
    let rootExpression = expression.match(FUNCTION_LIST_ACCESS_MATCHER)![1];
    return expressionToAstNodes(`${rootExpression}[]`);
  } else {
    if (expressionHasChildExpressions(expression)) {
      expressions.push(
        ...dotExpressionToNestedExpression(expression, knownType)
      );
    } else {
      expressions.push({
        expression,
        type: knownType
      });
    }
  }

  return expressions;
}

function expressionHasChildExpressions(expression: string) {
  return splitExpressionOnOuterPeriods(expression).length > 1;
}

function getExpressionForDomRepeatItems(
  expression: string,
  aliasMap: AliasMap
) {
  const domRepeatItemsExpressions = extractExpression(expression, aliasMap);

  if (domRepeatItemsExpressions.length > 1) {
    throw Error(
      "Multiple expressions found inside of dom-repeat items attribute."
    );
  }

  return expressionToAstNodes(domRepeatItemsExpressions[0], EXPRESSION.LIST);
}

export function getExpressionsForNode(
  node: CheerioElement,
  aliasMap: AliasMap
) {
  const nodeIsDomRepeat = isDomRepeat(node);

  const astNodes: AST_NODE[] = [];
  const attributeExpressions = extractNodeAttributes(node);
  const contentExpressions = extractExpression(
    extractNodeContents(node) || "",
    aliasMap
  );

  for (const attributeExpression of attributeExpressions) {
    if (ON_BINDING_ATTR_MATCHER.test(attributeExpression.attributeKey)) {
      // TODO maybe we should validate that users are not using [[ ]] or {{ }}
      // since it is invalid here.
      const onNode = expressionToAstNodes(
        `${attributeExpression.attributeValue}()`
      );

      if (onNode.length) {
        // We know that the event handlers have 1 argument, so we should enforce it.
        onNode[0].argumentCount = 1;
        astNodes.push(onNode[0]);
      }
    } else if (
      attributeExpression.attributeKey === "items" &&
      nodeIsDomRepeat
    ) {
      astNodes.push(
        ...getExpressionForDomRepeatItems(
          attributeExpression.attributeValue,
          aliasMap
        )
      );
    } else if (attributeExpression.attributeKey.endsWith('$')) {
      astNodes.push(
        ...expressionsToAstNodes(
          extractExpression(attributeExpression.attributeValue, aliasMap)
        )
      );
    } else if (node.type === 'tag' && node.name) {
      const expressions = expressionsToAstNodes(
        extractExpression(attributeExpression.attributeValue, aliasMap));
      for (const expression of expressions) {
        astNodes.push({
          type: EXPRESSION.PROPERTY_ASSIGNMENT,
          expression: expression.expression,
          rightHandSide: expression,
          tagName: node.name,
          propertyName: attributeExpression.attributeKey
        });
      }
    }
  }

  astNodes.push(...expressionsToAstNodes(contentExpressions));

  return astNodes;
}
