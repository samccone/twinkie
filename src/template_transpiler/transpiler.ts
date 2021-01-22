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
  parsePolymerBindingExpression,
  PolymerExpression,
  SyntaxNodeKind,
} from '../expression_parser/expression_parser';
import {TranspilerContext} from './context';
import {CodeBuilder} from './code_builder';
import {TsExpressionGenerator} from './ts_expression_generator';
import {
  BindingType,
  extractBindingParts,
  isRawExpression,
} from '../expression_extractor';
import {isExpressionWithTheOnlyBinding, isTextOnlyExpression} from '../utils';
import {
  ElementsProperties,
  PolymerPropertyInfo,
} from '../ts_code_parser/polymer_classes_parser';
import {SourceFile} from 'typescript';

export interface ElementTranspiler {
  canTranspile(element: CheerioElement): boolean;
  transpile(
    transpiler: TemplateTranspiler,
    builder: CodeBuilder,
    file: SourceFile,
    element: CheerioElement
  ): void;
}

export enum AttributeValueType {
  OneWayBinding = 'OneWayBinding', // [[abc]]
  TwoWayBinding = 'TwoWayBinding', // {{abc}}
  TextOnly = 'TextOnly', // "some text"
  MultiBinding = 'MultiBinding', // [[abc]]-text-[[def]
}

export class TemplateTranspiler {
  private readonly elementTranspilers: ElementTranspiler[] = [];
  private readonly contextStack: TranspilerContext[] = [];
  private currentContext: TranspilerContext;

  public constructor(
    private readonly codeBuilder: CodeBuilder,
    private readonly elementsProperties: ElementsProperties
  ) {
    this.currentContext = {
      localVars: new Set(),
      domRepeatVar: undefined,
    };
  }

  public registerElementTranspiler(transpiler: ElementTranspiler) {
    this.elementTranspilers.push(transpiler);
  }

  public transpile(file: SourceFile, elements: CheerioElement[]) {
    elements.forEach(el => this.transpileElement(file, el));
  }

  public transpileChildNodes(file: SourceFile, element: CheerioElement) {
    let childNodes = element.childNodes;
    if (element.tagName === 'template') {
      if (
        element.childNodes.length !== 1 ||
        element.childNodes[0].tagName !== 'root'
      ) {
        throw new Error('Expected only single root child');
      }
      childNodes = element.childNodes[0].childNodes;
    }
    this.transpile(file, childNodes);
  }

  public transpileElement(file: SourceFile, element: CheerioElement) {
    const elementTranspiler = this.elementTranspilers.find(transpiler =>
      transpiler.canTranspile(element)
    );
    if (!elementTranspiler) {
      throw new Error(
        `Internal error: ${element.tagName} doesn't have transpiler.`
      );
    }
    elementTranspiler.transpile(this, this.codeBuilder, file, element);
  }

  public transpilePolymerExpression(expression: PolymerExpression): string {
    return TsExpressionGenerator.fromPolymerExpresion(
      expression,
      this.currentContext.localVars
    );
  }

  public transpileAttributeValue(
    attrValue: string
  ): {
    attrValueType: AttributeValueType;
    tsExpression: string;
    reverseBindingExpression: string;
    negotiation?: boolean;
    stringExpression: string;
    whitespacesOnly: boolean;
  } {
    const bindingParts = extractBindingParts(attrValue);
    if (isTextOnlyExpression(bindingParts)) {
      const stringExpression = `\`${attrValue
        .replace(/\\/g, '\\')
        .replace(/`/g, '\\``')}\``;
      return {
        attrValueType: AttributeValueType.TextOnly,
        tsExpression: stringExpression,
        reverseBindingExpression: stringExpression,
        stringExpression,
        whitespacesOnly: attrValue.trim().length === 0,
      };
    }
    if (!isExpressionWithTheOnlyBinding(bindingParts)) {
      // Expressions like "abc-[[prop]]" or "[[prop1]][[prop2]]"
      const tsExpressions: string[] = bindingParts.map(part => {
        if (isRawExpression(part)) {
          const parseResult = parsePolymerBindingExpression(part.text);
          return (
            '${' + this.transpilePolymerExpression(parseResult.expression) + '}'
          );
        } else {
          return part;
        }
      });
      const stringExpression = '`' + tsExpressions.join('') + '`';
      return {
        attrValueType: AttributeValueType.MultiBinding,
        tsExpression: stringExpression,
        reverseBindingExpression: stringExpression,
        stringExpression,
        whitespacesOnly: false,
      };
    }

    const parseResult = parsePolymerBindingExpression(bindingParts[0].text);
    const tsExpression = this.transpilePolymerExpression(
      parseResult.expression
    );
    const reverseBindingExpression =
      parseResult.expression.type === SyntaxNodeKind.Negation
        ? this.transpilePolymerExpression(parseResult.expression.operand)
        : tsExpression;
    return {
      attrValueType:
        bindingParts[0].bindingType === BindingType.OneWay
          ? AttributeValueType.OneWayBinding
          : AttributeValueType.TwoWayBinding,
      tsExpression,
      reverseBindingExpression,
      negotiation: parseResult.expression.type === SyntaxNodeKind.Negation,
      stringExpression: '`${' + tsExpression + '}`',
      whitespacesOnly: false,
    };
  }

  public getCurrentContext(): TranspilerContext {
    return this.currentContext;
  }

  public updateCurrentContext(update: Partial<TranspilerContext>) {
    if (update.domRepeatVar) {
      this.currentContext.domRepeatVar = update.domRepeatVar;
    }
    if (update.localVars) {
      update.localVars.forEach(val => this.currentContext.localVars.add(val));
    }
  }

  pushContext(): void {
    const newContext: TranspilerContext = {
      localVars: new Set<string>(this.currentContext.localVars),
      domRepeatVar: this.currentContext.domRepeatVar,
    };
    this.contextStack.push(this.currentContext);
    this.currentContext = newContext;
  }

  popContext(): void {
    const context = this.contextStack.pop();
    if (!context) {
      throw new Error('Internal error');
    }
    this.currentContext = context;
  }

  getValueForSet(
    tagName: string,
    attrName: string,
    transpiledExpression: string
  ) {
    if (tagName === 'iron-input' && attrName === 'bind-value') {
      return `convert(${transpiledExpression})`;
    }
    return transpiledExpression;
  }

  getElementProperties(
    tagName: string
  ): Map<string, PolymerPropertyInfo> | undefined {
    return this.elementsProperties.get(tagName);
  }
}
