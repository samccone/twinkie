export interface AliasMap {
  [aliasName: string]: string;
}

export enum EXPRESSION {
  VALUE,
  FUNCTION,
  LIST,
  PROPERTY_ASSIGNMENT
}

export type BASE_AST_NODE = {
  expression: string;
  returnType?: EXPRESSION;
  argumentCount?: number;
  children?: AST_TREE;
  listIndexType?: AST_TREE;
};
export type MAIN_AST_NODE_TYPE =
    EXPRESSION.VALUE | EXPRESSION.FUNCTION | EXPRESSION.LIST;
export type MAIN_AST_NODE = BASE_AST_NODE & {
  type: MAIN_AST_NODE_TYPE;
}

// An AST node representing an assignment to a property on another element,
// So for:
//    <foo-bar fizz-baz="{{qux}}"></foo-bar>
//
//    tagName: 'foo-bar',
//    propertyName: 'fizz-baz',
//    rightHandSide: (AST_NODE for {{qux}}),
export type PROPERTY_ASSIGNMENT_AST_NODE = BASE_AST_NODE &  {
  type: EXPRESSION.PROPERTY_ASSIGNMENT;
  tagName: string;
  propertyName: string;
  rightHandSide: AST_NODE;
}

export type AST_NODE = MAIN_AST_NODE | PROPERTY_ASSIGNMENT_AST_NODE;

export interface AST_TREE {
  [key: string]: AST_NODE;
}
