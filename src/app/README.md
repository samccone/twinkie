The app to transpile polymer templates into the typescript files.

The app can be used under the bazel.

Usage:
```
twinkie --tsconfig tsconfig.json --outdir output_dir [--files file_list] [--outtsconfig outtsconfig.json] [--devrun] [--checkerrors]
```

Here:
* --tsconfig path_to_tsconfig.json - specifies path to a project
* --out-dir output_dir - specifies an output directory. If the directory is
  relative, it resolves relatively to the current working directory.
* --files file_list - list of files, for which a templates should be transpiled.
  Useful only when run from bazel
* --out-ts-config outtsconfig.json - if set, the app generates a tsconfig which
  includues all required files. This file can be passed to tscompiler for
  template checking.
* --dev-run - generates relative imports path instead of absolute path.
  It is useful if you want to run the app under the bazel and then temporary
  copy the output to your workspace for template fixing.
* --check-errors - prints typescript errors. Useful if the app doesn't work as
  expected.
  
Steps:
1. Read tsconfig.json and create program
2. Get all classes from a program
3. Filter classes and select polymer elements only
4. For each polymer element get information about tag, template, properties
5. Generate output files. The transpiled templates are placed into the same
   location in the output directory (i.e. if the file a/b/c.ts contains 2
   templates, then transpiled templates are placed in the outdir/a/b/c.ts file).
   Note: if a file doesn't contain a template, the app generates empty file.
   This simplifies bazel rules for the app.
6. Optionally: generate output tsconfig.json

After the app finishes, the typescript compiler should be run. The compiler
reports any template-related type-errors.

