import { expect } from "chai";
import { nodesToTree } from "./ast_tree_builder";
import { walkNodes } from "./dom_walker";
import * as Cheerio from "cheerio";
import { AliasMap, AST_NODE } from "./types";
import { getExpressionsForNode } from "./ast_builder";
import { printTree } from "./printer";

function astTreeFromString(str: string) {
  const parsed = Cheerio.parseHTML(str);
  const aliasMap: AliasMap = {};
  const nodes: AST_NODE[] = [];

  parsed.forEach(node => {
    walkNodes(node, aliasMap, (node: CheerioElement, aliasMap: AliasMap) => {
      nodes.push(...getExpressionsForNode(node, aliasMap));
    });
  });

  return nodesToTree(nodes);
}

describe("printing", () => {
  it("handles a simple case", () => {
    expect(
      printTree(
        astTreeFromString(`
            <div>[[a]]</div>
            <div>[[b(c, d)]]</div>
        `)
      )
    ).to.deep.equal(`export interface View {
  a: any;
  b: (arg0: any, arg1: any) => any;
  c: any;
  d: any;
};`);
  });

  it("handles nested case", () => {
    expect(
      printTree(
        astTreeFromString(`
            <div>[[a]]</div>
            <div>[[a.b.c]]</div>
        `)
      )
    ).to.deep.equal(`export interface View {
  a: {b: {c: any;};};
};`);
  });

  it("handles dom-repeat as function", () => {
    expect(
      printTree(
        astTreeFromString(`
          <template is="dom-repeat" items="[[foo()]]">
          </template>
        `)
      )
    ).to.deep.equal(`export interface View {
  foo: () => any[];
};`);
  });

  it("handles a dom-repeat case", () => {
    expect(
      printTree(
        astTreeFromString(`
        <template is="dom-repeat" items="[[foo]]">
            <div>[[item.zap]]</div>
        </template>
        `)
      )
    ).to.deep.equal(`export interface View {
  foo: {zap: any;}[];
};`);
  });
});
