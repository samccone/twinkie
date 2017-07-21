import { AST_NODE, AST_TREE } from "./types";

function expressionIsChild(expression: string) {
  return expression.indexOf("[]") !== -1;
}

function mergeNodeIntoTree(tree: AST_TREE, node: AST_NODE) {
  const existingNode = tree[node.expression];

  if (existingNode === undefined) {
    tree[node.expression] = node;
    return tree;
  }

  if (existingNode.children === undefined && node.children !== undefined) {
    existingNode.children = node.children;
  } else if (node.children) {
    for (const childNodeKey of Object.keys(node.children)) {
      if (existingNode.children === undefined) {
        existingNode.children = {};
      }
      mergeNodeIntoTree(existingNode.children, node.children[childNodeKey]);
    }
  }

  return tree;
}

function addNodeToTree(tree: AST_TREE, node: AST_NODE) {
  if (tree[node.expression] === undefined) {
    tree[node.expression] = node;
  }

  mergeNodeIntoTree(tree, node);
}

export function nodesToTree(nodes: AST_NODE[]) {
  const tree = {} as AST_TREE;

  for (const node of nodes) {
    if (expressionIsChild(node.expression)) {
      console.log("unhandled child expression", node);
    } else {
      addNodeToTree(tree, node);
    }
  }

  return tree;
}
