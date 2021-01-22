import {expect} from 'chai';
import {
  ExpressionParser,
  Identifier,
  LiteralExpression,
  parsePolymerBindingExpression,
  SyntaxNodeKind,
} from './expression_parser';

function identifier(name: string): Identifier {
  return {
    type: SyntaxNodeKind.Identifier,
    name,
  };
}

function literal(value: string): LiteralExpression {
  return {
    type: SyntaxNodeKind.Literal,
    value,
  };
}

describe('ExpressionParser tests', () => {
  it('identifier', () => {
    expect(ExpressionParser.parse('abc')).to.deep.equal(identifier('abc'));
  });

  it('property access expression', () => {
    expect(ExpressionParser.parse('abc.x.def')).to.deep.equal({
      type: SyntaxNodeKind.PropertyAccess,
      name: identifier('def'),
      expression: {
        type: SyntaxNodeKind.PropertyAccess,
        name: identifier('x'),
        expression: identifier('abc'),
      },
    });
  });

  it('property access expression', () => {
    expect(ExpressionParser.parse('abc.x.def')).to.deep.equal({
      type: SyntaxNodeKind.PropertyAccess,
      name: identifier('def'),
      expression: {
        type: SyntaxNodeKind.PropertyAccess,
        name: identifier('x'),
        expression: identifier('abc'),
      },
    });
  });

  it('simple method call', () => {
    expect(ExpressionParser.parse('abc()')).to.deep.equal({
      type: SyntaxNodeKind.MethodCall,
      expression: identifier('abc'),
      arguments: [],
    });
  });

  it('method call with property access expression', () => {
    expect(ExpressionParser.parse('abc.def()')).to.deep.equal({
      type: SyntaxNodeKind.MethodCall,
      expression: {
        type: SyntaxNodeKind.PropertyAccess,
        name: identifier('def'),
        expression: identifier('abc'),
      },
      arguments: [],
    });
  });

  it('method call with one argument', () => {
    expect(ExpressionParser.parse('abc(x)')).to.deep.equal({
      type: SyntaxNodeKind.MethodCall,
      expression: identifier('abc'),
      arguments: [identifier('x')],
    });
  });

  it('method call with simple wildcardpath argument', () => {
    expect(ExpressionParser.parse('abc(x.*)')).to.deep.equal({
      type: SyntaxNodeKind.MethodCall,
      expression: identifier('abc'),
      arguments: [
        {
          type: SyntaxNodeKind.WildcardPath,
          expression: identifier('x'),
        },
      ],
    });
  });
  it('method call with nested wildcardpath argument', () => {
    expect(ExpressionParser.parse('abc(x.y.*)')).to.deep.equal({
      type: SyntaxNodeKind.MethodCall,
      expression: identifier('abc'),
      arguments: [
        {
          type: SyntaxNodeKind.WildcardPath,
          expression: {
            type: SyntaxNodeKind.PropertyAccess,
            name: identifier('y'),
            expression: identifier('x'),
          },
        },
      ],
    });
  });

  it('method call with different arguments', () => {
    expect(
      ExpressionParser.parse('abc(x, y.z, "literal words", true, 145, a.*)')
    ).to.deep.equal({
      type: SyntaxNodeKind.MethodCall,
      expression: identifier('abc'),
      arguments: [
        identifier('x'),
        {
          type: SyntaxNodeKind.PropertyAccess,
          name: identifier('z'),
          expression: identifier('y'),
        },
        literal('"literal words"'),
        literal('true'),
        literal('145'),
        {
          type: SyntaxNodeKind.WildcardPath,
          expression: identifier('a'),
        },
      ],
    });
  });

  it('negotiation expression', () => {
    expect(ExpressionParser.parse('!abc()')).to.deep.equal({
      type: SyntaxNodeKind.Negation,
      operand: {
        type: SyntaxNodeKind.MethodCall,
        expression: identifier('abc'),
        arguments: [],
      },
    });
  });

  describe('invalid expressions', () => {
    it('nested call', () => {
      expect(() => ExpressionParser.parse('abc(def())')).to.throw();
    });

    it('missing bracket', () => {
      expect(() => ExpressionParser.parse('abc(def')).to.throw();
    });

    it('character after start', () => {
      expect(() => ExpressionParser.parse('abc.*.def')).to.throw();
    });
  });
});

describe('parsePolymerBindingExpression tests', () => {
  it('without event name', () => {
    expect(parsePolymerBindingExpression('abc')).to.deep.equal({
      expression: identifier('abc'),
      event: undefined,
    });
  });
  it('with event name', () => {
    expect(parsePolymerBindingExpression('abc::de')).to.deep.equal({
      expression: identifier('abc'),
      event: 'de',
    });
  });
});
