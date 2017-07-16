export interface AliasMap {
  [aliasName: string]: string;
}

export enum EXPRESSION {
  VALUE = "value",
  FUNCTION = "function",
  LIST = "list"
}

export interface AST_NODE {
  expression: string;
  type: EXPRESSION;
  returnType?: EXPRESSION;
  argumentCount?: number;
}
