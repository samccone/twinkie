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

import * as path from 'path';
import * as fs from 'fs';

// All paths in CommandLineOptions are absolute
export interface CommandLineOptions {
  tsConfig?: string;
  inputFiles?: Set<string>;
  outputDirectory?: string;
  outputTsConfig?: string;
  /**
   *  If true, the utility assumes that generated files are placed into the
   *  subdirectory at the same level as tsConfig and use relative imports.
   *  This options should be used only for development, not on CI
   *  For example:
   *
   *  tsconfig.json
   *  sub_dir
   *     file.ts
   *  tmpl_out/
   *    sub_dir
   *     file.ts This generated file use relative import from '../../sub_dir/file'
   */
  developerRun: boolean;

  checkTsErrors: boolean;
}

export function getCommandLineOptions(): CommandLineOptions {
  const argv = process.argv.slice(2); // Skip 'node' and path to this script
  const options: CommandLineOptions = {
    developerRun: false,
    checkTsErrors: false,
  };
  const cwd = process.cwd();
  while (argv.length > 0) {
    const arg = argv.shift();
    switch (arg) {
      case '--tsconfig':
        options.tsConfig = path.resolve(
          cwd,
          assertArgDefined(argv.shift(), arg)
        );
        break;
      case '--files':
        options.inputFiles = readFileList(assertArgDefined(argv.shift(), arg));
        break;
      case '--out-dir':
        options.outputDirectory = path.resolve(
          cwd,
          assertArgDefined(argv.shift(), arg)
        );
        break;
      case '--out-ts-config':
        options.outputTsConfig = path.resolve(
          cwd,
          assertArgDefined(argv.shift(), arg)
        );
        break;
      case '--dev-run':
        options.developerRun = true;
        break;
      case '--check-errors':
        options.checkTsErrors = true;
        break;
      default:
        throw new Error(`Invalid command line argument: ${arg}`);
    }
  }
  return options;
}

function readFileList(paramsFile: string): Set<string> {
  const paramsFileLines = fs
    .readFileSync(paramsFile, {
      encoding: 'utf-8',
    })
    .split(/\r?\n/);
  const cwd = process.cwd();
  return new Set(paramsFileLines.map(fileName => path.resolve(cwd, fileName)));
}

function assertArgDefined(arg: string | undefined, optionArg: string): string {
  if (!arg) {
    throw new Error(
      `The option '${optionArg}' must have a parameter right after it`
    );
  }
  return arg;
}
