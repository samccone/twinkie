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
  PolymerSyntaxNode,
  PropertyAccessExpression,
  SyntaxNodeKind,
  WildcardPathExpression,
} from '../expression_parser/expression_parser';
import {assertNever} from '../utils';

export interface PolymerSyntaxNodeVisitor<T> {
  visitNegation(node: NegationExpression): T;
  visitWildcardPath(node: WildcardPathExpression): T;
  visitPropertyAccess(node: PropertyAccessExpression): T;
  visitLiteral(node: LiteralExpression): T;
  visitMethodCall(node: MethodCallExpression): T;
  visitIdentifier(node: Identifier): T;
}

export function visitSyntaxNode<T>(
  node: PolymerSyntaxNode,
  visitor: PolymerSyntaxNodeVisitor<T>
): T {
  switch (node.type) {
    case SyntaxNodeKind.Negation:
      return visitor.visitNegation(node);
    case SyntaxNodeKind.WildcardPath:
      return visitor.visitWildcardPath(node);
    case SyntaxNodeKind.PropertyAccess:
      return visitor.visitPropertyAccess(node);
    case SyntaxNodeKind.Literal:
      return visitor.visitLiteral(node);
    case SyntaxNodeKind.MethodCall:
      return visitor.visitMethodCall(node);
    case SyntaxNodeKind.Identifier:
      return visitor.visitIdentifier(node);
    default:
      assertNever(node);
  }
}
