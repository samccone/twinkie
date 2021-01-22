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
  Diagnostic,
  formatDiagnostic,
  FormatDiagnosticsHost,
  sys,
} from 'typescript';

class FormatDiagnosticHostImpl implements FormatDiagnosticsHost {
  public static readonly Instance = new FormatDiagnosticHostImpl();
  private constructor() {}
  getCanonicalFileName(fileName: string): string {
    return fileName;
  }

  getCurrentDirectory(): string {
    return sys.getCurrentDirectory();
  }

  getNewLine(): string {
    return sys.newLine;
  }
}

function getFormattedDiagnostic(d: Diagnostic) {
  return formatDiagnostic(d, FormatDiagnosticHostImpl.Instance);
}

export function failWithDiagnostic(msg: string, diagnostic: Diagnostic) {
  throw new Error(`${msg}:\n${getFormattedDiagnostic(diagnostic)}`);
}

export function failWithDiagnostics(
  msg: string,
  diagnostics: readonly Diagnostic[]
) {
  const diagnosticsTexts = diagnostics.map(d =>
    getFormattedDiagnostic(d).trim()
  );
  throw new Error(`${msg}:\n${diagnosticsTexts.join('\n')}`);
}
