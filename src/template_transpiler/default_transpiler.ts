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

import {CodeBuilder} from './code_builder';
import {TemplateTranspiler} from './transpiler';
import {BlacklistedElementTranspiler} from './element_transpilers/blacklisted_element_transpiler';
import {DomRepeatElementTranspiler} from './element_transpilers/dom_repeat_transpiler';
import {DomIfElementTranspiler} from './element_transpilers/dom_if_transpiler';
import {OrdinaryTagTranspiler} from './element_transpilers/ordinary_tag_transpiler';
import {TextTranspiler} from './element_transpilers/text_transpiler';
import {CommentTranspiler} from './element_transpilers/comment_transpiler';
import {ElementsProperties} from '../ts_code_parser/polymer_classes_parser';

export function createTranspiler(
  builder: CodeBuilder,
  elementsProperties: ElementsProperties
) {
  const transpiler = new TemplateTranspiler(builder, elementsProperties);
  transpiler.registerElementTranspiler(new BlacklistedElementTranspiler());
  transpiler.registerElementTranspiler(new DomRepeatElementTranspiler());
  transpiler.registerElementTranspiler(new DomIfElementTranspiler());
  transpiler.registerElementTranspiler(new OrdinaryTagTranspiler());
  transpiler.registerElementTranspiler(new TextTranspiler());
  transpiler.registerElementTranspiler(new CommentTranspiler());
  return transpiler;
}
