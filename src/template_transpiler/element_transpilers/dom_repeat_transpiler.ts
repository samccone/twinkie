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

import {OrdinaryTagTranspiler} from './ordinary_tag_transpiler';
import {TemplateTranspiler} from '../transpiler';
import {CodeBuilder} from '../code_builder';
import {parsePolymerBindingExpression} from '../../expression_parser/expression_parser';
import {Logger} from '../../template_problems_logger';
import {SourceFile} from 'typescript';

const specialDomRepatAttributes = new Set([
  'items',
  'as',
  'indexAs',
  'itemIndexAs',
  'sort',
  'filter',
  'observe',
]);

const idRegexp = /^[A-Za-z_][A-Za-z0-9_]*$/;

function assertAttributeValueIsValidIdentifier(
  file: SourceFile,
  element: CheerioElement,
  attrName: string
) {
  const attrValue = element.attribs[attrName];
  if (!attrValue) return;
  if (!attrValue.match(idRegexp)) {
    Logger.problemWithAttribute(
      file,
      element,
      attrName,
      `Attribute value '${attrValue}' must be a valid identifier`
    );
  }
}

export class DomRepeatElementTranspiler extends OrdinaryTagTranspiler {
  canTranspile(element: CheerioElement): boolean {
    if (!super.canTranspile(element)) return false;
    return this.getActualTagName(element) === 'dom-repeat';
  }

  transpile(
    transpiler: TemplateTranspiler,
    builder: CodeBuilder,
    file: SourceFile,
    element: CheerioElement
  ): void {
    const items = element.attribs['items'];

    assertAttributeValueIsValidIdentifier(file, element, 'as');
    assertAttributeValueIsValidIdentifier(file, element, 'indexAs');
    assertAttributeValueIsValidIdentifier(file, element, 'itemsIndexAs');
    assertAttributeValueIsValidIdentifier(file, element, 'sort');
    assertAttributeValueIsValidIdentifier(file, element, 'filter');

    const as = element.attribs['as'] ?? 'item';
    const indexAs = element.attribs['indexAs'] ?? 'index';
    const itemsIndexAs = element.attribs['itemsIndexAs'] ?? 'itemsIndexAs';
    const sortFunction = element.attribs['sort'];
    const filter = element.attribs['filter'];
    const observe = element.attribs['observe'];
    this.transpileTagWithoutChildren(
      transpiler,
      builder,
      element,
      attrName => !specialDomRepatAttributes.has(attrName)
    );
    if (!items) {
      Logger.problemWithElement(
        file,
        element,
        'The "items" attribute is missed'
      );
    }

    const tsItems = transpiler.transpileAttributeValue(items);
    // Technically, all items can be either string or binding expression to string

    builder.startBlock();
    builder.addLine(`const ${indexAs} = 0;`);
    builder.addLine(`const ${itemsIndexAs} = 0;`);
    builder.addLine(`useVars(${indexAs}, ${itemsIndexAs});`);
    builder.addLine(
      `for(const ${as} of ${tsItems.tsExpression}!${
        filter ? `.filter(this.${filter}.bind(this))` : ''
      }${sortFunction ? `.sort(this.${sortFunction}.bind(this))` : ''})`
    );
    builder.startBlock();
    transpiler.pushContext();
    transpiler.updateCurrentContext({
      domRepeatVar: as,
      localVars: new Set([as, itemsIndexAs, indexAs]),
    });
    if (observe) {
      const observeExpressions = observe
        .split(' ')
        .map(s => s.trim())
        .map(expr =>
          transpiler.transpilePolymerExpression(
            parsePolymerBindingExpression(expr).expression
          )
        );
      builder.startBlock();
      builder.addLine(
        `const observerArray = [${observeExpressions.join(',')}]`
      );
      builder.addLine('useVars(observerArray)');
      builder.endBlock();
    }

    transpiler.transpileChildNodes(file, element);
    transpiler.popContext();
    builder.endBlock();
    builder.endBlock();
  }
}
