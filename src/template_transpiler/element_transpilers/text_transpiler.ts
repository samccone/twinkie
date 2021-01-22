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
  AttributeValueType,
  ElementTranspiler,
  TemplateTranspiler,
} from '../transpiler';
import {CheerioElementType} from '../../utils';
import {CodeBuilder} from '../code_builder';
import {SourceFile} from 'typescript';

export class TextTranspiler implements ElementTranspiler {
  canTranspile(element: CheerioElement): boolean {
    return element.type === CheerioElementType.Text;
  }

  transpile(
    transpiler: TemplateTranspiler,
    builder: CodeBuilder,
    file: SourceFile,
    element: CheerioElement
  ): void {
    const content = transpiler.transpileAttributeValue(element.nodeValue);
    if (content.attrValueType === AttributeValueType.TextOnly) return;
    builder.addTextContent(content.stringExpression);
  }
}
