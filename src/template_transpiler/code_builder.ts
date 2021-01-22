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

import {kebabCaseToCamelCase} from '../printer';
import {TemplateTranspiler} from './transpiler';
import {TranspilerContext} from './context';

export class CodeBuilder {
  private code = '';
  private indent = '';
  private readonly blockIndent = '  ';

  getCode(): string {
    return this.code;
  }

  public addLine(line: string) {
    this.code += `${this.indent}${line}\n`;
  }

  addTextContent(statement: string) {
    this.addLine(`setTextContent(${statement});\n`);
  }

  startBlock() {
    this.addLine('{');
    this.indent += this.blockIndent;
  }

  endBlock() {
    this.indent = this.indent.slice(0, -this.blockIndent.length);
    this.addLine('}');
  }

  beginElement(tagName: string) {
    this.startBlock();
    // Even if there is no attribute, it make sence to check that tagName is registered in HTMLElementTagNameMap
    this.addLine(`const el: HTMLElementTagNameMap['${tagName}'] = null!;`);
    this.addLine('useVars(el);');
  }

  endElement() {
    this.endBlock();
  }

  addElementPropertySet(attrName: string, getValueTsCode: string) {
    this.addLine(`el.${kebabCaseToCamelCase(attrName)} = ${getValueTsCode};`);
  }

  addAttributeSet(attrName: string, stringExpression: string) {
    this.addLine(
      `el.setAttribute('${kebabCaseToCamelCase(
        attrName
      )}', ${stringExpression});`
    );
  }

  addValueSetFromProperty(
    tagName: string,
    target: string,
    sourceAttr: string,
    negotation: boolean | undefined,
    transpiler: TemplateTranspiler
  ) {
    const value = transpiler.getValueForSet(
      tagName,
      sourceAttr,
      `el.${kebabCaseToCamelCase(sourceAttr)}`
    );
    if (negotation) {
      this.addLine(`${target} = !${value};`);
    } else {
      this.addLine(`${target} = ${value};`);
    }
  }

  subscribeEvent(
    eventName: string,
    handler: string,
    context: TranspilerContext
  ) {
    // dom-repeat adds model to the event. This complex handler is required
    // to handle both cases: when handler doesn't have arguments and when it has
    // arguments
    const listener = context.domRepeatVar
      ? `e => this.${handler}.bind(this, wrapInPolymerDomRepeatEvent(e, ${context.domRepeatVar}))()`
      : `this.${handler}.bind(this)`;
    this.addLine(`el.addEventListener('${eventName}', ${listener});`);
  }
}
