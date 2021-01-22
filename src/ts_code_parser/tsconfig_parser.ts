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
  createProgram,
  parseJsonConfigFileContent,
  Program,
  readConfigFile,
  sys,
} from 'typescript';
import * as path from 'path';
import {failWithDiagnostic, failWithDiagnostics} from './ts_diagnostic_utils';

function parseConfigFile(tsconfigFile: string) {
  const rawConfig = readConfigFile(tsconfigFile, sys.readFile);
  if (rawConfig.error) {
    failWithDiagnostic(
      `Can't parse config file ${tsconfigFile}`,
      rawConfig.error
    );
  }
  const config = parseJsonConfigFileContent(
    rawConfig.config,
    sys,
    path.dirname(tsconfigFile)
  );
  if (config.errors.length > 0) {
    failWithDiagnostics(`Can't parse ${tsconfigFile}`, config.errors);
  }

  return config;
}

export function createProgramFromTsConfig(tsconfigFullPath: string): Program {
  const config = parseConfigFile(tsconfigFullPath);
  return createProgram(config.fileNames, config.options);
}
