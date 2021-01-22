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
  Identifier,
  LiteralExpression,
  MethodCallExpression,
  NegationExpression,
  PolymerExpression,
  PropertyAccessExpression,
  WildcardPathExpression,
} from '../expression_parser/expression_parser';
import {PolymerSyntaxNodeVisitor, visitSyntaxNode} from './syntax_node_visitor';
import {LocalVars} from './context';

export class TsExpressionGenerator implements PolymerSyntaxNodeVisitor<string> {
  public static fromPolymerExpresion(
    expression: PolymerExpression,
    localVars: LocalVars
  ): string {
    return visitSyntaxNode(expression, new TsExpressionGenerator(localVars));
  }
  private constructor(private readonly localVars: LocalVars) {}
  visitIdentifier(node: Identifier, propertyAccess?: boolean): string {
    const addThis = !propertyAccess && !this.localVars.has(node.name);
    return addThis ? `this.${node.name}` : `${node.name}`;
  }

  visitLiteral(node: LiteralExpression): string {
    return node.value;
  }

  visitMethodCall(node: MethodCallExpression): string {
    const args = node.arguments.map(argument =>
      visitSyntaxNode(argument, this)
    );
    return `${visitSyntaxNode(node.expression, this)}(${args.join(', ')})`;
  }

  visitNegation(node: NegationExpression): string {
    return `!${visitSyntaxNode(node.operand, this)}`;
  }

  visitPropertyAccess(node: PropertyAccessExpression): string {
    return (
      `__f(${visitSyntaxNode(node.expression, this)})!.` +
      this.visitIdentifier(node.name, true)
    );
  }

  visitWildcardPath(node: WildcardPathExpression): string {
    return `pc(${visitSyntaxNode(node.expression, this)})`;
  }
}
