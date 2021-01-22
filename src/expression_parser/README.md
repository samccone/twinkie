This directory contains the expression parser for polymer binding expression.

The binding expression is an expression inside [[...]] or {{...}}.
For example, the following element contains 3 binding expressions:
<elem text="my-text-[[abc]]-{{f(x)}}" val="[[getVal(x)]]>
Here expressions are "abc", "f(x)" and "getVal(x)" 

The expression_tokenizer.ts provides ExpressionTokenizer.getTokens that
converts a string into array of tokens.

The expression_parser exposes provides the following methods/functions:

* parsePolymerBindingExpression can parse the following expressions
"hostProp::target-change-event" - it returns an object with an AST-tree and
event-name (see more here
https://polymer-library.polymer-project.org/3.0/docs/devguide/data-binding,
Two-way binding to a non-Polymer element)

* ExpressionParser.parse gets a binding expression without an event-name and
returns AST-tree for the expression.
It supports supreset of a polymer expressions, i.e. it can parse
some expressions that are not supported by polymer.
