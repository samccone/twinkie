import { expect } from "chai";
import {
  extractExpression,
  removePrimitiveExpressions
} from "./expression_extractor";

describe("strips primitives", () => {
  it("handles numbers", () => {
    expect(removePrimitiveExpressions(["1"])).to.deep.equal([]);
    expect(removePrimitiveExpressions(["12a"])).to.deep.equal(["12a"]);
  });

  it("handles strings", () => {
    expect(removePrimitiveExpressions(['"1"'])).to.deep.equal([]);
    expect(removePrimitiveExpressions(["'1'"])).to.deep.equal([]);
    expect(removePrimitiveExpressions(['"ok"1'])).to.deep.equal(['"ok"1']);
    expect(removePrimitiveExpressions(["'ok'1"])).to.deep.equal(["'ok'1"]);
  });

  it("handles booleans", () => {
    expect(extractExpression("false", {})).to.deep.equal([]);
    expect(extractExpression("true", {})).to.deep.equal([]);
  });
});

describe("strips negation prefixes", () => {
  it("handles strings", () => {
    expect(extractExpression("[[!a]]", {})).to.deep.equal(["a"]);
  });

  it("handles functions", () => {
    expect(extractExpression("[[!b()]]", {})).to.deep.equal(["b()"]);
  });
});

describe("extracting expressions", () => {
  it("handles an empty string", () => {
    expect(extractExpression("", {})).to.deep.equal([]);
  });

  it("handles a string with no bindings", () => {
    expect(extractExpression("hello guybrush", {})).to.deep.equal([]);
  });

  it("handles a string with one one-way binding", () => {
    expect(extractExpression("[[hi]]", {})).to.deep.equal(["hi"]);
  });

  it("handles a string with one two-way binding", () => {
    expect(extractExpression("[[hi]]{{you}}", {})).to.deep.equal(["hi", "you"]);
  });

  it("handles a string with mixed content", () => {
    expect(
      extractExpression(
        "hi sam [[how]]{{are}} you doing today [[nice]] i hope [[ok(wow)]].",
        {}
      )
    ).to.deep.equal(["how", "are", "nice", "ok(wow)"]);
  });
});

describe("unaliasing expressions", () => {
  it("does nothing when no matching aliases", () => {
    expect(extractExpression("[[ok]]", { zap: "tap" })).to.deep.equal(["ok"]);
  });

  it("unaliases an expression", () => {
    expect(extractExpression("[[ok.wow]]", { ok: "sam" })).to.deep.equal([
      "sam.wow"
    ]);
  });

  it("unaliases multiple expressions", () => {
    expect(
      extractExpression("[[ok.wow]]{{ok}}----[[no]]", { ok: "sam" })
    ).to.deep.equal(["sam.wow", "sam", "no"]);
  });

  it("only replaces the left expression", () => {
    expect(extractExpression("[[wow.ok]]", { ok: "sam" })).to.deep.equal([
      "wow.ok"
    ]);

    expect(extractExpression("[[ok.ok]]", { ok: "sam" })).to.deep.equal([
      "sam.ok"
    ]);
  });
});
