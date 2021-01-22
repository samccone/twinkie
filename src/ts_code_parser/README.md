The ts_code_parser provides methods/functions to extract information from
the typescript source code.

In particualar, the following functions are available:
* createProgramFromTsConfig (tsconfig_parser.ts) - creates a Program object
  from the tsconfig.json file

* getProgramClasses (code_parser.ts) - returns information about all classes in
  a Program

* isPolymerElement (polymer_classes_parser.ts) - checks whether the given class
  extends Polymer element or not. This is not precise check - it returns true
  if a class extends other type with the name "PolymerElement", without checking
  that PolymerElement is from the correct @polymer package. 
   
* getPolymerElementInfo (polymer_classes_parser.ts) - returns information about
  a given Polymer element: tag, template, properties, etc...
