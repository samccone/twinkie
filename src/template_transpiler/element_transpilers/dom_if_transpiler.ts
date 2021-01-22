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
import {AttributeValueType, TemplateTranspiler} from '../transpiler';
import {CodeBuilder} from '../code_builder';
import {Logger} from '../../template_problems_logger';
import {SourceFile} from 'typescript';

export class DomIfElementTranspiler extends OrdinaryTagTranspiler {
  canTranspile(element: CheerioElement): boolean {
    if (!super.canTranspile(element)) return false;
    return this.getActualTagName(element) === 'dom-if';
  }

  transpile(
    transpiler: TemplateTranspiler,
    builder: CodeBuilder,
    file: SourceFile,
    element: CheerioElement
  ): void {
    this.transpileTagWithoutChildren(
      transpiler,
      builder,
      element,
      attrName => attrName !== 'if'
    );

    if (!element.attribs['if']) {
      Logger.problemWithElement(file, element, 'The "if" attribute is missed.');
      return;
    }
    const condition = element.attribs['if'];
    const tsCondition = transpiler.transpileAttributeValue(condition);
    if (
      tsCondition.attrValueType !== AttributeValueType.OneWayBinding &&
      tsCondition.attrValueType !== AttributeValueType.TwoWayBinding
    ) {
      Logger.problemWithAttribute(
        file,
        element,
        'if',
        `The "if" attrubute value '${condition}' must be a single binding expression.`
      );
    }
    builder.addLine(`if (${tsCondition.tsExpression})`);
    builder.startBlock();
    transpiler.transpileChildNodes(file, element);
    builder.endBlock();
  }
}
