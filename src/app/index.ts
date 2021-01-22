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

import {createProgramFromTsConfig} from '../ts_code_parser/tsconfig_parser';
import {createSourceFileFilter} from '../ts_code_parser/source_file_filter';
import * as path from 'path';
import * as fs from 'fs';
import {getProgramClasses} from '../ts_code_parser/code_parser';
import {getPolymerElements} from '../ts_code_parser/polymer_classes_parser';
import {Diagnostic, DiagnosticCategory, Program, SourceFile} from 'typescript';
import {Logger} from '../template_problems_logger';
import {failWithDiagnostics} from '../ts_code_parser/ts_diagnostic_utils';
import {getCommandLineOptions} from './command_line_parser';
import {validateElementCode} from './element_code_validator';
import {generateFiles} from './file_generator';

async function main() {
  const cmdLineOptions = getCommandLineOptions();
  if (!cmdLineOptions.tsConfig || !cmdLineOptions.outputDirectory) {
    throw new Error(`One or more mandatory arguments are missed. Usage:
twinkie --tsconfig tsconfig.json --outdir output_dir [--files file_list] [--outtsconfig outtsconfig.json] [--devrun] [--checkerrors]
    `);
  }
  const program = createProgramFromTsConfig(cmdLineOptions.tsConfig);
  const baseDir = path.dirname(cmdLineOptions.tsConfig);
  const inputFiles = cmdLineOptions.inputFiles;

  const programFiles = program.getSourceFiles().filter(
    inputFiles
      ? (sourceFile: SourceFile) => inputFiles.has(sourceFile.fileName)
      : createSourceFileFilter({
          include: ['*.ts'],
          exclude: ['*.d.ts', '*_test.ts'],
        })
  );

  const typeChecker = program.getTypeChecker();
  if (cmdLineOptions.checkTsErrors) {
    assertNoProgramErrors(program);
  }

  const programClasses = getProgramClasses(typeChecker, programFiles);
  const polymerElements = getPolymerElements(typeChecker, programClasses);

  polymerElements.forEach(el => validateElementCode(el));

  const generatedFiles = generateFiles(
    cmdLineOptions.outputDirectory,
    baseDir,
    cmdLineOptions.developerRun,
    polymerElements,
    programFiles
  );

  if (cmdLineOptions.outputTsConfig) {
    const allProgramFilesNames = programFiles.map(sf => sf.fileName);
    const tsconfigContent = {
      extends: cmdLineOptions.tsConfig,
      compilerOptions: {
        outDir: null,
        incremental: false,
        noEmit: true,
      },
      files: [...allProgramFilesNames, generatedFiles],
    };
    fs.writeFileSync(
      cmdLineOptions.outputTsConfig,
      JSON.stringify(tsconfigContent, null, 2)
    );
  }

  const codeProblems = Logger.getProblems();
  if (codeProblems.length > 0) {
    throw new Error(
      'The following problems found in the code:\n' + codeProblems.join('\n')
    );
  }
}

function assertNoProgramErrors(program: Program) {
  assertNoErrors('getGlobalDiagnostics', program.getGlobalDiagnostics());
  assertNoErrors('getSemanticDiagnostics', program.getSemanticDiagnostics());
  assertNoErrors('getSyntacticDiagnostics', program.getSyntacticDiagnostics());
}

function assertNoErrors(
  diagnotsticName: string,
  diagnostics: readonly Diagnostic[]
) {
  const errorDiagnostics = diagnostics.filter(
    diag => diag.category === DiagnosticCategory.Error
  );
  if (errorDiagnostics.length > 0) {
    failWithDiagnostics(
      `The ${diagnotsticName} returns errors`,
      errorDiagnostics
    );
  }
}

main().catch(error => {
  console.error(error.message);
  console.error(error.stack);
  // eslint-disable-next-line no-process-exit
  process.exit(1);
});
