import * as Cheerio from "cheerio";
import { expect } from "chai";
import { getExpressionsForNode } from "./ast_builder";
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

  it("handles nested aliasing", () => {
    const node = Cheerio.parseHTML(`[[hey.tap]][[ok.hey]]`)[0];

    expect(getExpressionsForNode(node, { hey: "foo" })).to.deep.equal([
      {
        expression: "foo.tap",
        type: EXPRESSION.VALUE
      },
      {
        expression: "ok.hey",
        type: EXPRESSION.VALUE
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

  it("can extract a function with nexted functions", () => {
    const node = Cheerio.parseHTML(`[[hey(a(c), b)]]`)[0];

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
        expression: "c",
        type: EXPRESSION.VALUE
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
