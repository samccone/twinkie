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

import {SourceFile} from 'typescript';
import {
  ElementsProperties,
  getElementsProperties,
  PolymerElementInfo,
} from '../ts_code_parser/polymer_classes_parser';
import {CodeBuilder} from '../template_transpiler/code_builder';
import {createTranspiler} from '../template_transpiler/default_transpiler';
import {getOutputFileContent} from '../template_transpiler/output_template';
import * as Cheerio from 'cheerio';
import * as path from 'path';
import * as fs from 'fs';

export function generateFiles(
  outputDirectory: string,
  baseDir: string,
  developerRun: boolean,
  polymerElements: PolymerElementInfo[],
  sourceFiles: SourceFile[]
): string[] {
  const templatesBySourceFile = groupBy(
    polymerElements.filter(element => element.template),
    element => element.template!.sourceFile.fileName
  );
  const elementsProperties = getElementsProperties(polymerElements);

  const generatedFiles: string[] = [];
  for (const sourceFile of sourceFiles) {
    const fileName = sourceFile.fileName;
    // Produce the same directory layout in the outputDirectory
    const outputFile = path.resolve(
      outputDirectory,
      path.relative(baseDir, fileName)
    );
    generatedFiles.push(outputFile);
    if (templatesBySourceFile.has(fileName)) {
      const importPathResolver = developerRun
        ? createRelativeImportPathResolver(fileName, baseDir)
        : absoluteImportPathResolver;
      generateFile(
        sourceFile,
        outputFile,
        templatesBySourceFile.get(fileName)!,
        elementsProperties,
        importPathResolver
      );
    } else {
      generateEmptyFile(outputFile);
    }
  }
  return generatedFiles;
}

function generateEmptyFile(targetFile: string) {
  fs.mkdirSync(path.dirname(targetFile), {recursive: true});
  fs.writeFileSync(targetFile, '');
}

function generateFile(
  sourceFile: SourceFile,
  targetFile: string,
  elements: PolymerElementInfo[],
  elementsProperties: ElementsProperties,
  importPathResolver: (sourceFile: SourceFile) => string
) {
  const imports = elements.map(
    element =>
      `import {${element.className}} from '${removeTsFileExtension(
        importPathResolver(element.declaration.sourceFile)
      )}';`
  );
  const builder = new CodeBuilder();
  for (const element of elements) {
    builder.addLine(
      `export class ${element.className}Check extends ${element.className}`
    );
    builder.startBlock();
    builder.addLine('templateCheck()');
    builder.startBlock();
    if (element.template) {
      const parsed = Cheerio.parseHTML(element.template.content);
      if (parsed) {
        // if content is empty string, the parsed is null
        createTranspiler(builder, elementsProperties).transpile(
          sourceFile,
          parsed
        );
      }
    }
    builder.endBlock();
    builder.endBlock();
  }
  fs.mkdirSync(path.dirname(targetFile), {recursive: true});
  fs.writeFileSync(
    targetFile,
    getOutputFileContent(imports, builder.getCode())
  );
}

function groupBy<T, TKey>(
  items: T[],
  getKey: (item: T) => TKey
): Map<TKey, T[]> {
  const map: Map<TKey, T[]> = new Map();
  for (const item of items) {
    const key = getKey(item);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(item);
  }
  return map;
}
function removeTsFileExtension(filePath: string): string {
  return filePath.endsWith('.ts') ? filePath.slice(0, -3) : filePath;
}

function absoluteImportPathResolver(sourceFile: SourceFile): string {
  return sourceFile.fileName;
}

function createRelativeImportPathResolver(file: string, baseDir: string) {
  return (sourceFile: SourceFile) => {
    // template_output is a fake directory, it shouldn't appear in the final
    // import path. It is used only to calculate relative import path.
    const filePath = path.join(
      '/template_output/',
      path.relative(baseDir, file)
    );
    const importFrom = '/' + path.relative(baseDir, sourceFile.fileName);
    return path.relative(path.dirname(filePath), importFrom);
  };
}
