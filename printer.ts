import { AST_NODE, AST_TREE, EXPRESSION } from "./types";

export function printTree(tree: AST_TREE, interfaceName = "View") {
  let ret = "";

  ret += `export interface ${interfaceName} {\n`;

  for (const expressionKey of Object.keys(tree)) {
    const expression = tree[expressionKey];
    expression.expression;
    ret += `${expression.expression}: ${printExpressionType(expression)};\n`;
  }

  ret += "};";

  return ret;
}

export function printUse(
  tree: AST_TREE,
  realType: string,
  undefinedCheck = false
) {
  const ret = [
    `class ${realType}UseChecker extends ${realType} {\n`,
    "  __useCheckerTestFunc() {\n",
  ];
  for (const expressionKey of Object.keys(tree)) {
    const node = tree[expressionKey];
    let expressionUses;
    if (undefinedCheck) {
      expressionUses = getNodeUses(node, "undefined");
    } else {
      expressionUses = getNodeUses(node, "null!");
    }
    for (const use of expressionUses) {
      if (use.type === undefined) {
        ret.push(`    this.${use.expression};\n`);
      } else {
        ret.push(`    {const _: ${use.type} = this.${use.expression};}\n`);
      }
    }
  }

  ret.push("  }\n", "}\n");
  return ret.join("");
}

type NodeUse = {expression: string, type: string|undefined};

function *getNodeUses(
    node: AST_NODE, argValue: string):IterableIterator<NodeUse> {
  switch (node.type) {
    case EXPRESSION.LIST: {
      yield {expression: `${node.expression}!`, type: `Array<any>`};
      if (node.children) {
        for (const childNodeExpression of Object.keys(node.children)) {
          const innerUses =
              getNodeUses(node.children[childNodeExpression], argValue);
          for (const innerUse of innerUses) {
            yield {
              expression: `${node.expression}!.${innerUse.expression}`,
              type: innerUse.type,
            };
          }
        }
      }
      if (node.listIndexType) {
        for (const listNodeExpression of Object.keys(node.listIndexType)) {
          const innerUses =
              getNodeUses(node.listIndexType[listNodeExpression], argValue);
          for (const innerUse of innerUses) {
            yield {
              expression: `${node.expression}![0]!.${innerUse.expression}`,
              type: innerUse.type,
            }
          }
        }
      }

      break;
    }
    case EXPRESSION.VALUE: {
      yield {expression: `${node.expression}`, type: undefined};
      if (node.children) {
        for (const childNodeExpression of Object.keys(node.children)) {
          const childUses =
              getNodeUses(node.children[childNodeExpression], argValue);
          for (const childUse of childUses) {
            yield {
              expression: `${node.expression}!.${childUse.expression}`,
              type: childUse.type,
            };
          }
        }
      }

      break;
    }
    case EXPRESSION.FUNCTION: {
      const argList = [];
      if (node.argumentCount) {
        for (let i = 0; i < node.argumentCount; i++) {
          argList.push(argValue);
        }
      }
      yield {
        expression: `${node.expression}!(${argList.join(", ")})`,
        type: undefined,
      };

      break;
    }
  }
}

function printChildrenType(children: AST_TREE, arrayType?: string): string {
  const childType =
    "null|undefined|{" +
    Object.keys(children)
      .map(childKey => children[childKey])
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
      return "null|undefined|ArrayLike<any|null|undefined>";
    case EXPRESSION.VALUE:
      return "any|null|undefined";
    case EXPRESSION.FUNCTION:
      return "(() => any|null|undefined)|null|undefined";
  }

  return "any|null|undefined";
}

function argumentCountToArgs(count: number) {
  return new Array(count)
    .fill("")
    .map((_, i) => {
      return `arg${i}: any|null|undefined`;
    })
    .join(", ");
}

function printListIndexType(node: AST_NODE): string {
  if (
    treeHasNodes(node.listIndexType) &&
    node.listIndexType!["[]"] !== undefined
  ) {
    return `null|undefined|ArrayLike<${printExpressionType(
      node.listIndexType!["[]"]
    )}>`;
  }
  if (treeHasNodes(node.listIndexType)) {
    return `null|undefined|ArrayLike<${printChildrenType(
      node.listIndexType!
    )}|null|undefined>`;
  } else if (node.type === EXPRESSION.LIST) {
    return `null|undefined|ArrayLike<any|null|undefined>`;
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
      : "any|null|undefined";
  }

  if (node.type === EXPRESSION.LIST) {
    if (treeHasNodes(node.listIndexType) || treeHasNodes(node.children)) {
      return printChildrenType(node.children || {}, printListIndexType(node));
    }
    return "null|undefined|ArrayLike<any|null|undefined>";
  }

  if (node.type === EXPRESSION.FUNCTION) {
    return printFunctionExpression(node);
  }

  return "any|null|undefined";
}
