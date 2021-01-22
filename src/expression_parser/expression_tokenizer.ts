export interface Token {
  type: TokenType;
  text: string;
}

export enum TokenType {
  StringLiteral = 'StringLiteral', // String in a single or double quotes, quotes are included in Token.text
  BooleanLiteral = 'BooleanLiteral', // true or false
  NumberLiteral = 'NumberLiteral', // Any javascript number
  OpenSquareBracket = 'OpenSquareBracket', // [
  CloseSquareBracket = 'CloseSquareBracket', // ]
  OpenBracket = 'OpenBracket', // (
  CloseBracket = 'CloseBracket', // )
  Period = 'Period', // .
  Exclamation = 'Exclamation', // !
  Comma = 'Comma', // ,
  Star = 'Star', // *
  Identifier = 'Identifier', // Everything else (for ex. 123abc is identifier too)
}

const singleCharToken = new Map<string, TokenType>([
  ['[', TokenType.OpenSquareBracket],
  [']', TokenType.CloseSquareBracket],
  ['(', TokenType.OpenBracket],
  [')', TokenType.CloseBracket],
  ['.', TokenType.Period],
  ['!', TokenType.Exclamation],
  [',', TokenType.Comma],
  ['*', TokenType.Star],
]);

export class ExpressionTokenizer {
  public static getTokens(expression: string): Token[] {
    const tokenizer = new ExpressionTokenizer(expression);
    tokenizer.splitExpression();
    return tokenizer.tokens;
  }
  private tokens: Token[] = [];
  private tokenStart = 0;
  private constructor(private readonly expression: string) {}
  private splitExpression(): void {
    let i = 0;
    while (i < this.expression.length) {
      const ch = this.expression[i];
      if (ch === '"' || ch === "'") {
        this.finishCurrentToken(i);
        const closedQuoteIndex = this.expression.indexOf(ch, i + 1);
        if (closedQuoteIndex < 0) {
          throw new Error('Unterminated string literal');
        }
        this.finishCurrentToken(closedQuoteIndex + 1);
        i = closedQuoteIndex + 1;
      } else if (singleCharToken.has(ch) || ch === ' ') {
        this.finishCurrentToken(i);
        if (ch !== ' ') {
          this.finishCurrentToken(i + 1);
        } else {
          this.tokenStart = i + 1;
        }
        i++;
      } else {
        i++;
      }
    }
    this.finishCurrentToken(this.expression.length);
  }

  private finishCurrentToken(nextTokenStart: number) {
    const length = nextTokenStart - this.tokenStart;
    if (length > 0) {
      const text = this.expression.substring(this.tokenStart, nextTokenStart);
      this.tokens.push({
        type: this.getTokenType(text),
        text,
      });
    }
    this.tokenStart = nextTokenStart;
  }

  private getTokenType(text: string): TokenType {
    if (singleCharToken.has(text)) {
      return singleCharToken.get(text)!;
    }
    if (text === 'true' || text === 'false') {
      return TokenType.BooleanLiteral;
    }
    if (text[0] === '"' || text[0] === "'") {
      return TokenType.StringLiteral;
    }
    const number = Number(text);
    if (!isNaN(number)) {
      return TokenType.NumberLiteral;
    }
    return TokenType.Identifier;
  }
}
