export interface AliasMap {
  [aliasName: string]: string;
}

export enum EXPRESSION {
  VALUE,
  FUNCTION,
  LIST
}

export interface AST_NODE {
  expression: string;
  type: EXPRESSION;
  returnType?: EXPRESSION;
  argumentCount?: number;
  children?: AST_TREE;
  listIndexType?: AST_TREE;
}

export interface AST_TREE {
  [key: string]: AST_NODE;
}
