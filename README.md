Flow Of Processing

```
* DOM_WALKER
* EXPRESSION_EXTRACTOR
* AST_BUILDER
* AST_TREE_BUILDER
* PRINTER
```

How to use

To print the generated class:

```
./bin.js test/data/nested.html
```


To print a faux use of the class:

```
./bin.js test/data/nested.html MyView --print-use
```