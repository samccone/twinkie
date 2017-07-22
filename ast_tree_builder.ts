import { AST_NODE, AST_TREE, EXPRESSION } from "./types";

const LIST_INDEX_TYPE_MATCHER_REGEX = /(.*)\[\]$/;

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

function addListIndexType(tree: AST_TREE, node: AST_NODE) {
  const rootExpressionMatcher = node.expression.match(
    LIST_INDEX_TYPE_MATCHER_REGEX
  );

  if (rootExpressionMatcher == null) {
    throw new Error(`Unable to extract root expression from ${node}`);
  }

  const rootExpression = rootExpressionMatcher[1];

  if (tree[rootExpression] === undefined) {
    tree[rootExpression] = {
      expression: rootExpression,
      type: EXPRESSION.LIST,
      listIndexType: node.children
    };
  } else {
    if (tree[rootExpression].listIndexType === undefined) {
      tree[rootExpression].listIndexType = {};
    }

    for (const child of Object.values(node.children)) {
      mergeNodeIntoTree(tree[rootExpression].listIndexType!, child);
    }
  }
}

export function nodesToTree(nodes: AST_NODE[]) {
  const tree = {} as AST_TREE;

  for (const node of nodes) {
    if (node.expression.match(LIST_INDEX_TYPE_MATCHER_REGEX)) {
      addListIndexType(tree, node);
    } else {
      addNodeToTree(tree, node);
    }
  }

  return tree;
}
