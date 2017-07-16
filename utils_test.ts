import { expect } from "chai";
import {
  isExpressionFunction,
  getFunctionArguments,
  getFunctionName
} from "./utils";

describe("detecting functions", () => {
  it("can detect when there is no function", () => {
    expect(isExpressionFunction("afv")).to.be.false;
  });

  it("can detect when there is a function", () => {
    expect(isExpressionFunction("a()")).to.be.true;
  });
});

describe("getting function arguments", () => {
  it("handles when not passed a valid function", () => {
    expect(getFunctionArguments("fooo")).to.deep.equal([]);
  });

  it("handles when there are no arguments", () => {
    expect(getFunctionArguments("fooo()")).to.deep.equal([]);
  });

  it("handles where there are arguments", () => {
    expect(getFunctionArguments("fooo(a)")).to.deep.equal(["a"]);
    expect(getFunctionArguments("fooo(a, b)")).to.deep.equal(["a", "b"]);
  });

  it("handles nested functions", () => {
    expect(getFunctionArguments("fo(a, b(c))")).to.deep.equal(["a", "b(c)"]);
  });
});

describe("getting function name", () => {
  it("handles when not passed a valid function", () => {
    expect(getFunctionName("fooo")).to.equal(null);
  });

  it("handles a function", () => {
    expect(getFunctionName("bar()")).to.eq("bar");
  });
});
