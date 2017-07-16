import { extractNodeAttributes, extractNodeContents } from "./dom_walker";
import { extractExpression } from "./expression_extractor";
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

function expressionToAstNodes(
  expression: string,
  knownType: EXPRESSION = EXPRESSION.VALUE
) {
  const expressions: AST_NODE[] = [];
  if (isExpressionFunction(expression)) {
    const functionName = getFunctionName(expression);
    const functionArguments = getFunctionArguments(expression);

    if (functionName != null) {
      expressions.push({
        expression: functionName,
        type: EXPRESSION.FUNCTION,
        argumentCount: functionArguments.length,
        returnType: knownType
      });
    }

    for (const argumentExpression of getFunctionArguments(expression)) {
      expressions.push(...expressionToAstNodes(argumentExpression));
    }
  } else {
    expressions.push({
      expression,
      type: knownType
    });
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
