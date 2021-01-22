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
import {ClassDeclarationInfo} from './ts_code_parser/code_parser';
import {SourceFile} from 'typescript';

/**
 * TemplateProblemsLogger stores information about problems found in a template.
 * Allows to print all found problems in all templates together.
 */
class TemplateProblemsLogger {
  private problems: string[] = [];

  problemWithAttribute(
    file: SourceFile,
    element: CheerioElement,
    attrName: string,
    message: string
  ) {
    this.problems.push(
      `Problem with template in file: ${file.fileName}, element: ${element.tagName}, attribute ${attrName}: ${message}`
    );
  }

  problemWithElement(
    file: SourceFile,
    element: CheerioElement,
    message: string
  ) {
    this.problems.push(
      `Problem with template in file: ${file.fileName}, element: ${element.tagName}: ${message}`
    );
  }

  problemWithClass(classDeclaration: ClassDeclarationInfo, message: string) {
    this.problems.push(
      `Problem with class in file: ${
        classDeclaration.sourceFile.fileName
      }, class: ${classDeclaration.declaration.name?.getText()}: ${message}`
    );
  }

  public getProblems(): string[] {
    return [...this.problems];
  }
}

export const Logger = new TemplateProblemsLogger();
