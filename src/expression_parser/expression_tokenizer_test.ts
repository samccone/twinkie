import {ExpressionTokenizer, Token, TokenType} from './expression_tokenizer';
import {expect} from 'chai';

describe('tokenize expression', () => {
  it('empty expression', () => {
    expect(ExpressionTokenizer.getTokens('')).to.be.deep.equal([]);
  });

  describe('single token expressions', () => {
    function checkSingleToken(expr: string, expectedType: TokenType) {
      const expectedTokens: Token[] = [
        {
          type: expectedType,
          text: expr.trim(),
        },
      ];
      expect(ExpressionTokenizer.getTokens(expr)).to.be.deep.equal(
        expectedTokens
      );
      expect(ExpressionTokenizer.getTokens(` ${expr}`)).to.be.deep.equal(
        expectedTokens
      );
      expect(ExpressionTokenizer.getTokens(`${expr} `)).to.be.deep.equal(
        expectedTokens
      );
      expect(ExpressionTokenizer.getTokens(`  ${expr}   `)).to.be.deep.equal(
        expectedTokens
      );
    }

    it('single quoted string literal', () => {
      checkSingleToken("'abcd \" efg'", TokenType.StringLiteral);
    });

    it('single quoted empty string literal', () => {
      checkSingleToken("''", TokenType.StringLiteral);
    });

    it('double quoted string literal', () => {
      checkSingleToken('"abcd \' efg"', TokenType.StringLiteral);
    });

    it('double quoted empty string literal', () => {
      checkSingleToken('""', TokenType.StringLiteral);
    });

    it('true boolean literal', () => {
      checkSingleToken('true', TokenType.BooleanLiteral);
    });

    it('false boolean literal', () => {
      checkSingleToken('false', TokenType.BooleanLiteral);
    });

    it('number literal without fraction', () => {
      checkSingleToken('123', TokenType.NumberLiteral);
    });

    it('number literal with fraction', () => {
      checkSingleToken('123', TokenType.NumberLiteral);
    });

    it('open square bracket', () => {
      checkSingleToken('[', TokenType.OpenSquareBracket);
    });

    it('close square bracket', () => {
      checkSingleToken(']', TokenType.CloseSquareBracket);
    });

    it('open bracket', () => {
      checkSingleToken('(', TokenType.OpenBracket);
    });

    it('close bracket', () => {
      checkSingleToken(')', TokenType.CloseBracket);
    });

    it('period', () => {
      checkSingleToken('.', TokenType.Period);
    });

    it('exclamation', () => {
      checkSingleToken('!', TokenType.Exclamation);
    });

    it('comma', () => {
      checkSingleToken(',', TokenType.Comma);
    });

    it('star', () => {
      checkSingleToken('*', TokenType.Star);
    });

    it('identifier chars only', () => {
      checkSingleToken('abcdef', TokenType.Identifier);
    });

    it('identifier chars and numbers', () => {
      checkSingleToken('abc123', TokenType.Identifier);
    });

    it('identifier chars and numbers', () => {
      checkSingleToken('abc123', TokenType.Identifier);
    });

    it('identifier starts with numbers', () => {
      checkSingleToken('123abc', TokenType.Identifier);
    });
  });

  it('simple property access expression', () => {
    expect(ExpressionTokenizer.getTokens('abcd.ef')).to.be.deep.equal([
      {type: TokenType.Identifier, text: 'abcd'},
      {type: TokenType.Period, text: '.'},
      {type: TokenType.Identifier, text: 'ef'},
    ]);
  });

  it('method call expression', () => {
    expect(
      ExpressionTokenizer.getTokens('abcd(ef, gh.*, "qwe",true,  125,\'xyz\')')
    ).to.be.deep.equal([
      {type: TokenType.Identifier, text: 'abcd'},
      {type: TokenType.OpenBracket, text: '('},
      {type: TokenType.Identifier, text: 'ef'},
      {type: TokenType.Comma, text: ','},
      {type: TokenType.Identifier, text: 'gh'},
      {type: TokenType.Period, text: '.'},
      {type: TokenType.Star, text: '*'},
      {type: TokenType.Comma, text: ','},
      {type: TokenType.StringLiteral, text: '"qwe"'},
      {type: TokenType.Comma, text: ','},
      {type: TokenType.BooleanLiteral, text: 'true'},
      {type: TokenType.Comma, text: ','},
      {type: TokenType.NumberLiteral, text: '125'},
      {type: TokenType.Comma, text: ','},
      {type: TokenType.StringLiteral, text: "'xyz'"},
      {type: TokenType.CloseBracket, text: ')'},
    ]);
  });

  it('element access expresion', () => {
    expect(ExpressionTokenizer.getTokens('array[index].name')).to.be.deep.equal(
      [
        {type: TokenType.Identifier, text: 'array'},
        {type: TokenType.OpenSquareBracket, text: '['},
        {type: TokenType.Identifier, text: 'index'},
        {type: TokenType.CloseSquareBracket, text: ']'},
        {type: TokenType.Period, text: '.'},
        {type: TokenType.Identifier, text: 'name'},
      ]
    );
  });
});
