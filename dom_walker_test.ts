import * as Cheerio from "cheerio";
import { expect } from "chai";
import { extractNodeAttributes, extractNodeContents } from "./dom_walker";

describe("walking attrs", () => {
  it("handles when a node has no attributes", () => {
    const node = Cheerio.parseHTML("<div></div>")[0];
    expect(extractNodeAttributes(node)).to.deep.equal([]);
  });

  it("handles when a node has attributes", () => {
    const node = Cheerio.parseHTML("<div one=2 three='four'></div>")[0];
    expect(extractNodeAttributes(node)).to.deep.equal([
      {
        attributeKey: "one",
        attributeValue: "2"
      },
      {
        attributeKey: "three",
        attributeValue: "four"
      }
    ]);
  });
});

describe("extracting contents", () => {
  it("skips comment nodes", () => {
    const parsed = Cheerio.parseHTML("<div><!-- <p>[[a]]</p> --></div>");
    expect(
      parsed
        .reduce((accum, node) => {
          accum.push(extractNodeContents(node));
          return accum;
        }, [])
        .filter((v: null | string) => v != null)
    ).to.deep.equal([]);
  });

  it("handle when a node has no content", () => {
    const node = Cheerio.parseHTML("<div></div>")[0];
    expect(extractNodeContents(node)).to.eq(null);
  });

  it("handle when a node has content", () => {
    const node = Cheerio.parseHTML("monkey island")[0];
    expect(extractNodeContents(node)).to.eq("monkey island");
  });
});
