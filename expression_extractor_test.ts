import { expect } from "chai";
import { extractExpression } from "./expression_extractor";

describe("extracting expressions", () => {
  it("handles an empty string", () => {
    expect(extractExpression("")).to.deep.equal([]);
  });

  it("handles a string with no bindings", () => {
    expect(extractExpression("hello guybrush")).to.deep.equal([]);
  });

  it("handles a string with one one-way binding", () => {
    expect(extractExpression("[[hi]]")).to.deep.equal(["hi"]);
  });

  it("handles a string with one two-way binding", () => {
    expect(extractExpression("[[hi]]{{you}}")).to.deep.equal(["hi", "you"]);
  });

  it("handles a string with mixed content", () => {
    expect(
      extractExpression(
        "hi sam [[how]]{{are}} you doing today [[nice]] i hope [[ok(wow)]]."
      )
    ).to.deep.equal(["how", "are", "nice", "ok(wow)"]);
  });
});
