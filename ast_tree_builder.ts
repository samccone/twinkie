import { AST_NODE, AST_TREE, EXPRESSION } from "./types";

const LIST_INDEX_TYPE_MATCHER_REGEX = /(.*)\[\]$/;

function mergeNodeIntoTree(tree: AST_TREE, node: AST_NODE) {
  if (node.expression.match(LIST_INDEX_TYPE_MATCHER_REGEX)) {
    addListIndexType(tree, node);
    return;
  }

  if (tree[node.expression] === undefined) {
    tree[node.expression] = node;
  }

  const existingNode = tree[node.expression];

  if (existingNode.children === undefined && node.children !== undefined) {
    existingNode.children = {};
  }

  if (node.children === undefined) {
    node.children = {};
  }

  if (existingNode.children !== undefined) {
    for (const childKey of Object.keys(node.children)) {
      const child = node.children[childKey];
      if (child.expression.match(LIST_INDEX_TYPE_MATCHER_REGEX)) {
        addListIndexType(existingNode.children, child);
      } else {
        mergeNodeIntoTree(existingNode.children, child);
      }
    }
  }

  // Allow a node to go from VALUE type to a "more refined" type.
  if (node.type !== existingNode.type) {
    if (existingNode.type === EXPRESSION.VALUE) {
      existingNode.type = node.type;
    }
  }

  return tree;
}

// Given an N dimensional array value foo[][][][] insert into the parent
// node correctly.
function addSubArrayToListNode(
  tree: AST_TREE,
  node: AST_NODE,
  rootExpression: string
) {
  let rootKey = rootExpression;
  let depth = 0;
  let nodeRef: AST_NODE | undefined;

  while (rootKey.match(LIST_INDEX_TYPE_MATCHER_REGEX)) {
    depth++;
    rootKey = rootKey.match(LIST_INDEX_TYPE_MATCHER_REGEX)![1];
  }

  for (let i = 0; i < depth; ++i) {
    if (nodeRef === undefined) {
      nodeRef = tree[rootKey];
    } else {
      nodeRef = nodeRef.listIndexType!["[]"];
    }
  }

  if (nodeRef && Object.keys(nodeRef.listIndexType || {}).length) {
    if (!nodeRef.listIndexType!["[]"]) {
      throw new Error(
        `${rootExpression} expression already has a list index type and can not also have an array index type Please file a bug!`
      );
    }
  }

  nodeRef!.listIndexType = {
    "[]": {
      expression: "[]",
      type: EXPRESSION.LIST,
      listIndexType: {}
    }
  };

  for (const childKey of Object.keys(node.children || {})) {
    const child = node.children![childKey];
    mergeNodeIntoTree(nodeRef!.listIndexType!["[]"].listIndexType!, child);
  }
}

function addListIndexType(tree: AST_TREE, node: AST_NODE) {
  const rootExpressionMatcher = node.expression.match(
    LIST_INDEX_TYPE_MATCHER_REGEX
  );

  if (rootExpressionMatcher == null) {
    throw new Error(
      `Unable to extract root expression from ${JSON.stringify(node)}`
    );
  }

  const rootExpression = rootExpressionMatcher[1];

  if (rootExpression.match(LIST_INDEX_TYPE_MATCHER_REGEX)) {
    addSubArrayToListNode(tree, node, rootExpression);
    return;
  }

  if (tree[rootExpression] === undefined) {
    tree[rootExpression] = {
      expression: rootExpression,
      type: EXPRESSION.LIST,
      listIndexType: {}
    };
  }

  if (tree[rootExpression].listIndexType === undefined) {
    tree[rootExpression].listIndexType = {};
  }

  for (const childKey of Object.keys(node.children || {})) {
    const child = node.children![childKey];
    mergeNodeIntoTree(tree[rootExpression].listIndexType!, child);
  }
}

export function nodesToTree(nodes: AST_NODE[]) {
  const tree = {} as AST_TREE;
  for (const node of nodes) {
    if (node.expression.match(LIST_INDEX_TYPE_MATCHER_REGEX)) {
      addListIndexType(tree, node);
    } else {
      mergeNodeIntoTree(tree, node);
    }
  }

  return tree;
}
