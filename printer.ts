import { AST_NODE, AST_TREE, EXPRESSION } from "./types";

export function printTree(tree: AST_TREE, interfaceName: string = "View") {
  let ret = "";

  ret += `export interface ${interfaceName} {\n`;

  for (const expression of Object.values(tree)) {
    expression.expression;
    ret += `${expression.expression}: ${printExpressionType(expression)};\n`;
  }

  ret += "};";

  return ret;
}

function printChildrenType(children: AST_TREE, arrayType?: string): string {
  const childType =
    "{" +
    Object.values(children)
      .map(childNode => {
        return `${childNode.expression}: ${printExpressionType(childNode)};`;
      })
      .filter(v => v.length)
      .join(" ") +
    "}";

  if (arrayType) {
    return `${arrayType} & ${childType}`;
  }

  return childType;
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

function printListIndexType(node: AST_NODE) {
  if (treeHasNodes(node.listIndexType)) {
    return `ArrayLike<${printChildrenType(node.listIndexType!)}>`;
  } else if (node.type === EXPRESSION.LIST) {
    return `ArrayLike<any>`;
  }

  return "";
}

function printFunctionExpression(node: AST_NODE) {
  const root = `(${argumentCountToArgs(node.argumentCount || 0)}) =>`;

  if (treeHasNodes(node.children)) {
    return `${root} ${printChildrenType(
      node.children!,
      printListIndexType(node)
    )}`;
  } else if (node.listIndexType !== undefined) {
    return `${root} ${printChildrenType({}, printListIndexType(node))}`;
  }

  return `${root} ${expressionToString(node.returnType)}`;
}

function treeHasNodes(tree?: AST_TREE) {
  return tree !== undefined && Object.keys(tree).length > 0;
}

function printExpressionType(node: AST_NODE) {
  if (node.type === EXPRESSION.VALUE) {
    return treeHasNodes(node.children)
      ? printChildrenType(node.children!, printListIndexType(node))
      : "any";
  }

  if (node.type === EXPRESSION.LIST) {
    if (treeHasNodes(node.listIndexType) || treeHasNodes(node.children)) {
      return printChildrenType(node.children || {}, printListIndexType(node));
    }
    return "any[]";
  }

  if (node.type === EXPRESSION.FUNCTION) {
    return printFunctionExpression(node);
  }

  return "any";
}
