import { AST_NODE, AST_TREE, EXPRESSION } from "./types";

export function printTree(tree: AST_TREE) {
  let ret = "";

  ret += "export interface View {\n";

  for (const expression of Object.values<AST_NODE>(tree)) {
    expression.expression;
    ret += `${expression.expression}: ${printExpressionType(expression)};\n`;
  }

  ret += "};";

  return ret;
}

function printChildrenType(children: AST_TREE): string {
  return (
    "{" +
    Object.values(children)
      .map(childNode => {
        return `${childNode.expression}: ${printExpressionType(childNode)};`;
      })
      .join(" ") +
    "}"
  );
}

function expressionToString(expression: EXPRESSION = EXPRESSION.VALUE) {
  switch (expression) {
    case EXPRESSION.LIST:
      return "any[]";
    case EXPRESSION.VALUE:
      return "any";
    case EXPRESSION.FUNCTION:
      return "() => any";
  }
}

function argumentCountToArgs(count: number) {
  return new Array(count)
    .fill("")
    .map((_, i) => {
      return `arg${i}: any`;
    })
    .join(", ");
}

function printExpressionType(node: AST_NODE) {
  if (node.type === EXPRESSION.VALUE) {
    return node.children !== undefined && Object.keys(node.children).length > 0
      ? printChildrenType(node.children)
      : "any";
  }

  if (node.type === EXPRESSION.FUNCTION) {
    return `(${argumentCountToArgs(
      node.argumentCount || 0
    )}) => ${node.children !== undefined && Object.keys(node.children).length
      ? printChildrenType(node.children)
      : expressionToString(node.returnType)}`;
  }

  if (node.type === EXPRESSION.LIST) {
    return "any[]";
  }

  return "any";
}
