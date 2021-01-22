/**
 * @license
 * Copyright (C) 2020 The Android Open Source Project
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
  escapeLeadingUnderscores,
  Declaration,
  Expression,
  isCallExpression,
  isGetAccessor,
  isIdentifier,
  isNoSubstitutionTemplateLiteral,
  isReturnStatement,
  isStringLiteral,
  isTaggedTemplateExpression,
  isPropertyAssignment,
  isVariableDeclaration,
  isObjectLiteralExpression,
  NodeArray,
  SourceFile,
  Symbol,
  SymbolFlags,
  Type,
  TypeChecker,
} from 'typescript';
import {ClassDeclarationInfo} from './code_parser';
import {getPropertyName} from '../code_util';

export function isPolymerElement(classDeclarationInfo: ClassDeclarationInfo) {
  return extendsPolymerElement(classDeclarationInfo.type);
}

// See https://www.typescriptlang.org/docs/handbook/basic-types.html
export enum TsPropertyType {
  NotSet = 0,
  Boolean = 1,
  Number = 2,
  Enum = 4,
  Other = 8, // String, Array, Tuple, Unknown, Any, Void, Null, Undefined, Never, Object
}

export enum DeclaredPolymerPropertyType {
  Boolean = 'Boolean',
  Date = 'Date',
  Number = 'Number',
  String = 'String',
  Object = 'Object',
}

export interface PolymerElementInfo {
  declaration: ClassDeclarationInfo;
  className: string; // The name in ts.classDeclaration can be undefined, but PolymerElement must be defined with class name
  tag: string;
  template?: PolymerTemplateInfo;
  properties: PolymerPropertyInfo[];
}

export interface PolymerTemplateInfo {
  content: string;
  sourceFile: SourceFile;
}

export interface PolymerPropertyInfo {
  name: string;
  tsPropertyType: Type;
  declaredPolymerPropertyType: DeclaredPolymerPropertyType;
  reflectToAttribute: boolean;
}

export function getPolymerElements(
  typeChecker: TypeChecker,
  classes: ClassDeclarationInfo[]
): PolymerElementInfo[] {
  return classes
    .filter(isPolymerElement)
    .map(classInfo => getPolymerElementInfo(typeChecker, classInfo));
}

// ElementsProperties maps tagName to the map of properties.
// Map of properites maps propertyName to PolymerPropertyInfo
export type ElementsProperties = Map<string, Map<string, PolymerPropertyInfo>>;

export function getElementsProperties(
  polymerElements: PolymerElementInfo[]
): ElementsProperties {
  return new Map(
    polymerElements.map(element => [
      element.tag,
      new Map(element.properties.map(prop => [prop.name, prop])),
    ])
  );
}

export function getPolymerElementInfo(
  typeChecker: TypeChecker,
  polymerElementClassDeclarationInfo: ClassDeclarationInfo
): PolymerElementInfo {
  const className = polymerElementClassDeclarationInfo.declaration.name;
  if (!className) {
    throw new Error(
      `Polymer element doesn't have a class name. File: ${polymerElementClassDeclarationInfo.sourceFile.fileName}`
    );
  }
  return {
    declaration: polymerElementClassDeclarationInfo,
    tag: getTagName(polymerElementClassDeclarationInfo),
    className: className.text,
    template: getPolymerElementTemplate(
      typeChecker,
      polymerElementClassDeclarationInfo
    ),
    properties: getPolymerElementProperties(
      typeChecker,
      polymerElementClassDeclarationInfo
    ),
  };
}

function extendsPolymerElement(type: Type): boolean {
  const baseTypes = type.getBaseTypes();
  if (!baseTypes) {
    return false;
  }
  for (const baseType of baseTypes) {
    if (isPolymerElementType(baseType)) {
      return true;
    }
  }
  return false;
}

function isPolymerElementType(type: Type): boolean {
  if (type.isIntersection()) {
    for (const subType of type.types) {
      if (isPolymerElementType(subType)) {
        return true;
      }
    }
    return false;
  } else {
    if (!type.symbol) {
      throw new Error('Internal error!');
    }
    return type.symbol.getName() === 'PolymerElement';
  }
}

function getTagName(elementDeclaration: ClassDeclarationInfo): string {
  const argParser: DecoratorArgumentParser<string> = args => {
    if (args.length !== 1) {
      throw new Error('Invalid decorator');
    }
    const tagNameArg = args[0];
    if (!isStringLiteral(tagNameArg)) {
      throw new Error('Unsupported argument type in decorator');
    }
    return tagNameArg.text;
  };
  const customElementTagNames = getDecorators(
    [elementDeclaration.declaration],
    'customElement',
    argParser
  );
  if (customElementTagNames.length === 0) {
    throw new Error('Decorator not found on class');
  }
  if (customElementTagNames.length > 1) {
    throw new Error('Found more than 1 decorator on class');
  }
  return customElementTagNames[0];
}

type DecoratorArgumentParser<T> = (args: NodeArray<Expression>) => T;

function flat<T>(items: ReadonlyArray<ReadonlyArray<T> | undefined>): T[] {
  return items.reduce((result: T[], nestedItems) => {
    if (nestedItems) result.push(...nestedItems);
    return result;
  }, [] as T[]);
}

function getDecorators<T>(
  declarations: Declaration[],
  decoratorName: string,
  argumentParser: DecoratorArgumentParser<T>
): T[] {
  const decorators = flat(declarations.map(d => d.decorators));
  if (!decorators) return [];
  const result: T[] = [];
  for (const decorator of decorators) {
    const expression = decorator.expression;
    if (!isCallExpression(expression)) {
      throw new Error('Unsupported decorator expression');
    }
    if (!isIdentifier(expression.expression)) {
      throw new Error('Unsupported decorator expression.expression');
    }
    if (expression.expression.text !== decoratorName) continue;
    result.push(argumentParser(expression.arguments));
  }
  return result;
}

function getTemplateFromExpression(expr: Expression) {
  if (!isTaggedTemplateExpression(expr)) {
    throw new Error('Internal error');
  }
  if (!isIdentifier(expr.tag) || expr.tag.text !== 'html') {
    throw new Error('Internal error');
  }
  if (!isNoSubstitutionTemplateLiteral(expr.template)) {
    throw new Error('Internal error');
  }
  return expr.template.text;
}

function getPolymerElementTemplate(
  typeChecker: TypeChecker,
  polymerElementClassDeclarationInfo: ClassDeclarationInfo
): PolymerTemplateInfo | undefined {
  const templateGetterSymbol = polymerElementClassDeclarationInfo.type.symbol.exports?.get(
    escapeLeadingUnderscores('template')
  );
  if (!templateGetterSymbol) {
    return undefined;
  }
  if (templateGetterSymbol.declarations.length !== 1) {
    throw new Error('Internal error');
  }
  const declaration = templateGetterSymbol.declarations[0];
  if (!isGetAccessor(declaration)) {
    throw new Error('Internal error');
  }
  const statements = declaration.body?.statements;
  if (!statements || statements.length !== 1) {
    throw new Error('Internal error');
  }
  const returnStatement = statements[0];
  if (!isReturnStatement(returnStatement) || !returnStatement.expression) {
    throw new Error('Internal error');
  }

  if (isIdentifier(returnStatement.expression)) {
    // Case 1: return imported template
    const identifierSymbol = typeChecker.getSymbolAtLocation(
      returnStatement.expression
    );
    if (!identifierSymbol || identifierSymbol.declarations.length !== 1) {
      throw new Error('Internal error');
    }
    const aliasedSymbol = typeChecker.getAliasedSymbol(identifierSymbol);
    if (!aliasedSymbol || !aliasedSymbol.valueDeclaration) {
      throw new Error('Internal error');
    }
    const declaration = aliasedSymbol.valueDeclaration;
    if (!isVariableDeclaration(declaration) || !declaration.initializer) {
      throw new Error('Internal error');
    }
    return {
      sourceFile: declaration.getSourceFile(),
      content: getTemplateFromExpression(declaration.initializer),
    };
  } else if (isTaggedTemplateExpression(returnStatement.expression)) {
    // Case 2: the template defined inside template property
    return {
      sourceFile: returnStatement.getSourceFile(),
      content: getTemplateFromExpression(returnStatement.expression),
    };
  }
  throw new Error('Internal error');
}

function getTsPropertyType(typeChecker: TypeChecker, tsProperty: Symbol): Type {
  const types = tsProperty.declarations.map(decl =>
    typeChecker.getTypeOfSymbolAtLocation(tsProperty, decl)
  );
  if (types.length > 1) {
    const dedupTypes = [...new Set(types)];
    if (dedupTypes.length > 1) {
      throw new Error('Unsupported: property have multiple declaration');
    }
  }
  return types[0];
}

function getPolymerElementProperties(
  typeChecker: TypeChecker,
  polymerElementClassDeclarationInfo: ClassDeclarationInfo
): PolymerPropertyInfo[] {
  const properties = polymerElementClassDeclarationInfo.type
    .getProperties()
    .filter(s => s.flags & SymbolFlags.Property);

  const parsePropertyDecoratorArgs: DecoratorArgumentParser<DeclaredPolymerPropertyType> = args => {
    if (args.length === 0) return DeclaredPolymerPropertyType.Object;
    if (args.length > 1) {
      throw new Error('@property decorator can have 0 or 1 argument');
    }
    const arg = args[0];
    if (!isObjectLiteralExpression(arg)) {
      throw new Error('Unsupported @property argument');
    }
    const typeProperty = arg.properties.find(
      prop => getPropertyName(prop.name) === 'type'
    );
    if (!typeProperty) {
      throw new Error('@property decorator must have type property');
    }
    if (!isPropertyAssignment(typeProperty)) {
      throw new Error('Unsupported property initializer');
    }
    if (!isIdentifier(typeProperty.initializer)) {
      throw new Error('Unsupported @property type initializer');
    }
    return typeProperty.initializer.text as DeclaredPolymerPropertyType;
  };
  const result: PolymerPropertyInfo[] = [];
  for (const tsProperty of properties) {
    const polymerTypes = getDecorators(
      tsProperty.declarations,
      'property',
      parsePropertyDecoratorArgs
    );
    if (polymerTypes.length === 0) continue;
    if (polymerTypes.length > 1) {
      throw new Error('More than 1 @polymer decorator found');
    }
    result.push({
      name: tsProperty.name,
      tsPropertyType: getTsPropertyType(typeChecker, tsProperty),
      declaredPolymerPropertyType: polymerTypes[0],
      reflectToAttribute: false,
    });
  }
  return result;
}
