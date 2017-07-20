import * as Cheerio from "cheerio";
import { expect } from "chai";
import {
  splitExpressionOnOuterPeriods,
  getExpressionsForNode
} from "./ast_builder";
import { EXPRESSION } from "./types";

describe("extracting an expression", () => {
  it("handles simple aliasing", () => {
    const node = Cheerio.parseHTML(`[[hey]]`)[0];

    expect(getExpressionsForNode(node, { hey: "foo" })).to.deep.equal([
      {
        expression: "foo",
        type: EXPRESSION.VALUE
      }
    ]);
  });

  it("splits expressions when multiple nesting levels and observers are in place", () => {
    it("splits expressions when multiple nesting levels are in place", () => {
      expect(splitExpressionOnOuterPeriods("a.b(z(12), t.*).c.*")).to.deep.eq([
        "a",
        "b(z(12), t.*)",
        "c"
      ]);
    });
  });

  it("splits expressions when multiple nesting levels are in place", () => {
    expect(splitExpressionOnOuterPeriods("a.b(z(12), t).c")).to.deep.eq([
      "a",
      "b(z(12), t)",
      "c"
    ]);
  });

  it("splits expressions on outer periods", () => {
    expect(splitExpressionOnOuterPeriods("hi.bob(a, b.t).zap")).to.deep.eq([
      "hi",
      "bob(a, b.t)",
      "zap"
    ]);
  });

  it("splits expressions on regular periods with no parens", () => {
    expect(splitExpressionOnOuterPeriods("hi.bob.zap")).to.deep.eq([
      "hi",
      "bob",
      "zap"
    ]);
  });

  it("splits expressions when no periods", () => {
    expect(splitExpressionOnOuterPeriods("hi")).to.deep.eq(["hi"]);
  });

  it("handles second position function call with property accessor", () => {
    const node = Cheerio.parseHTML(`[[a.b(z(12),t).c]]`)[0];

    expect(getExpressionsForNode(node, {})).to.deep.equal([
      {
        expression: "a",
        type: EXPRESSION.VALUE,
        children: {
          b: {
            expression: "b",
            type: EXPRESSION.FUNCTION,
            returnType: EXPRESSION.VALUE,
            argumentCount: 2,
            children: {
              c: {
                type: EXPRESSION.VALUE,
                expression: "c",
                children: {}
              }
            }
          }
        }
      },
      {
        expression: "z",
        type: EXPRESSION.FUNCTION,
        returnType: EXPRESSION.VALUE,
        argumentCount: 1
      },
      {
        expression: "t",
        type: EXPRESSION.VALUE
      }
    ]);
  });

  it("handles simple function call with property accessor", () => {
    const node = Cheerio.parseHTML(`[[a(z, 1).c]]`)[0];

    expect(getExpressionsForNode(node, {})).to.deep.equal([
      {
        argumentCount: 2,
        children: {
          c: {
            expression: "c",
            type: EXPRESSION.VALUE,
            children: {}
          }
        },
        expression: "a",
        returnType: EXPRESSION.VALUE,
        type: EXPRESSION.FUNCTION
      },
      {
        expression: "z",
        type: EXPRESSION.VALUE
      }
    ]);
  });

  it("handles nested aliasing", () => {
    const node = Cheerio.parseHTML(`[[hey.tap]][[ok.hey]]`)[0];

    expect(getExpressionsForNode(node, { hey: "foo" })).to.deep.equal([
      {
        expression: "foo",
        type: EXPRESSION.VALUE,
        children: {
          tap: {
            expression: "tap",
            type: EXPRESSION.VALUE,
            children: {}
          }
        }
      },
      {
        expression: "ok",
        type: EXPRESSION.VALUE,
        children: {
          hey: {
            expression: "hey",
            type: EXPRESSION.VALUE,
            children: {}
          }
        }
      }
    ]);
  });
});

describe("extracting an expression", () => {
  it("can extract a function with no arguments", () => {
    const node = Cheerio.parseHTML(`[[hey()]]`)[0];

    expect(getExpressionsForNode(node, {})).to.deep.equal([
      {
        expression: "hey",
        type: EXPRESSION.FUNCTION,
        returnType: EXPRESSION.VALUE,
        argumentCount: 0
      }
    ]);
  });

  it("can extract a function with negated arguments", () => {
    const node = Cheerio.parseHTML(`[[!hey(!a, 1, !b, c)]]`)[0];

    expect(getExpressionsForNode(node, {})).to.deep.equal([
      {
        expression: "hey",
        type: EXPRESSION.FUNCTION,
        returnType: EXPRESSION.VALUE,
        argumentCount: 4
      },
      {
        expression: "a",
        type: EXPRESSION.VALUE
      },
      {
        expression: "b",
        type: EXPRESSION.VALUE
      },
      {
        expression: "c",
        type: EXPRESSION.VALUE
      }
    ]);
  });

  it("can extract a function with primitive number arguments", () => {
    const node = Cheerio.parseHTML(`[[hey(1, b)]]`)[0];

    expect(getExpressionsForNode(node, {})).to.deep.equal([
      {
        expression: "hey",
        type: EXPRESSION.FUNCTION,
        returnType: EXPRESSION.VALUE,
        argumentCount: 2
      },
      {
        expression: "b",
        type: EXPRESSION.VALUE
      }
    ]);
  });

  it("can extract a function with primitive string arguments", () => {
    const node = Cheerio.parseHTML(`[[hey("wow", 'zap', b)]]`)[0];

    expect(getExpressionsForNode(node, {})).to.deep.equal([
      {
        expression: "hey",
        type: EXPRESSION.FUNCTION,
        returnType: EXPRESSION.VALUE,
        argumentCount: 3
      },
      {
        expression: "b",
        type: EXPRESSION.VALUE
      }
    ]);
  });

  it("can extract a function with primitive bool arguments", () => {
    const node = Cheerio.parseHTML(`[[hey(b, false, true)]]`)[0];

    expect(getExpressionsForNode(node, {})).to.deep.equal([
      {
        expression: "hey",
        type: EXPRESSION.FUNCTION,
        returnType: EXPRESSION.VALUE,
        argumentCount: 3
      },
      {
        expression: "b",
        type: EXPRESSION.VALUE
      }
    ]);
  });

  it("can extract a function with arguments", () => {
    const node = Cheerio.parseHTML(`[[hey(a, b)]]`)[0];

    expect(getExpressionsForNode(node, {})).to.deep.equal([
      {
        expression: "hey",
        type: EXPRESSION.FUNCTION,
        returnType: EXPRESSION.VALUE,
        argumentCount: 2
      },
      {
        expression: "a",
        type: EXPRESSION.VALUE
      },
      {
        expression: "b",
        type: EXPRESSION.VALUE
      }
    ]);
  });

  it("can extract a function with nested functions with observers", () => {
    const node = Cheerio.parseHTML(`[[hey(a(k.c.*), b.*)]]`)[0];

    expect(getExpressionsForNode(node, {})).to.deep.equal([
      {
        expression: "hey",
        type: EXPRESSION.FUNCTION,
        returnType: EXPRESSION.VALUE,
        argumentCount: 2
      },
      {
        expression: "a",
        type: EXPRESSION.FUNCTION,
        argumentCount: 1,
        returnType: EXPRESSION.VALUE
      },
      {
        expression: "k",
        type: EXPRESSION.VALUE,
        children: {
          c: {
            expression: "c",
            type: EXPRESSION.VALUE,
            children: {}
          }
        }
      },
      {
        expression: "b",
        type: EXPRESSION.VALUE
      }
    ]);
  });

  it("can extract a function with nested functions", () => {
    const node = Cheerio.parseHTML(`[[hey(a(k.c), b)]]`)[0];

    expect(getExpressionsForNode(node, {})).to.deep.equal([
      {
        expression: "hey",
        type: EXPRESSION.FUNCTION,
        returnType: EXPRESSION.VALUE,
        argumentCount: 2
      },
      {
        expression: "a",
        type: EXPRESSION.FUNCTION,
        argumentCount: 1,
        returnType: EXPRESSION.VALUE
      },
      {
        expression: "k",
        type: EXPRESSION.VALUE,
        children: {
          c: {
            expression: "c",
            type: EXPRESSION.VALUE,
            children: {}
          }
        }
      },
      {
        expression: "b",
        type: EXPRESSION.VALUE
      }
    ]);
  });

  it("can extract a simple expression", () => {
    const node = Cheerio.parseHTML(`[[hey]]`)[0];

    expect(getExpressionsForNode(node, {})).to.deep.equal([
      {
        expression: "hey",
        type: EXPRESSION.VALUE
      }
    ]);
  });
});

describe("dom-repeat", () => {
  it("handles a dom-repeat when a function", () => {
    const node = Cheerio.parseHTML(
      `<template is="dom-repeat" items="[[wow()]]"></template>`
    )[0];

    expect(getExpressionsForNode(node, {})).to.deep.equal([
      {
        expression: "wow",
        type: EXPRESSION.FUNCTION,
        returnType: EXPRESSION.LIST,
        argumentCount: 0
      }
    ]);
  });

  it("handles a dom-repeat ", () => {
    const node = Cheerio.parseHTML(
      `<template is="dom-repeat" items="[[wow]]"></template>`
    )[0];

    expect(getExpressionsForNode(node, {})).to.deep.equal([
      {
        expression: "wow",
        type: EXPRESSION.LIST
      }
    ]);
  });

  it("complains when a dom-repeat has multiple item bindings", () => {
    const node = Cheerio.parseHTML(
      `<template is="dom-repeat" items="[[wow]] [[zap]]"></template>`
    )[0];

    expect(() => getExpressionsForNode(node, {})).to.throw();
  });
});
