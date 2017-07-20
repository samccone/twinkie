import { extractNodeAttributes, extractNodeContents } from "./dom_walker";
import {
  extractExpression,
  stripNegationPrefixes,
  removePrimitiveExpressions,
  removeObserverPostfixes
} from "./expression_extractor";
import { AliasMap, AST_NODE, EXPRESSION } from "./types";
import {
  isExpressionFunction,
  getFunctionArguments,
  getFunctionName,
  isDomRepeat
} from "./utils";

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
  knownType: EXPRESSION = EXPRESSION.VALUE
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
        type: EXPRESSION.FUNCTION,
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
  knownType: EXPRESSION = EXPRESSION.VALUE,
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
  knownType: EXPRESSION = EXPRESSION.VALUE
) {
  const expressions: AST_NODE[] = [];

  if (isExpressionFunction(expression)) {
    expressions.push(...functionExpressionToAstNodes(expression, knownType));
  } else {
    if (expression.indexOf(".") !== -1) {
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
    if (attributeExpression.attributeKey === "items" && nodeIsDomRepeat) {
      astNodes.push(
        ...getExpressionForDomRepeatItems(
          attributeExpression.attributeValue,
          aliasMap
        )
      );
    } else {
      astNodes.push(
        ...expressionsToAstNodes(
          extractExpression(attributeExpression.attributeValue, aliasMap)
        )
      );
    }
  }

  astNodes.push(...expressionsToAstNodes(contentExpressions));

  return astNodes;
}
