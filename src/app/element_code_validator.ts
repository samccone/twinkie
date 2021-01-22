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
import {PolymerElementInfo} from '../ts_code_parser/polymer_classes_parser';
import {Logger} from '../template_problems_logger';
import {ClassDeclaration, SyntaxKind} from 'typescript';

/**
 * Checks that polymer element correctly defines a class.
 * Right now there is only one requirement - the class must be exported.
 */
export function validateElementCode(element: PolymerElementInfo) {
  if (!hasExportModifier(element.declaration.declaration)) {
    Logger.problemWithClass(
      element.declaration,
      'The class must have export modifier'
    );
  }
}

function hasExportModifier(classDeclaration: ClassDeclaration): boolean {
  if (!classDeclaration.modifiers) return false;
  return classDeclaration.modifiers.some(
    m => m.kind === SyntaxKind.ExportKeyword
  );
}
