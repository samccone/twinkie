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
  it("handes dom-repeat as function with * observer", () => {
    expect(
      printTree(
        astTreeFromString(`
            <template is="dom-repeat" items="[[getFoo(bob.tap.*)]]">
              <template is="dom-repeat" items="[[item.foo]]"></template>
            </template>
        `)
      )
    ).to.deep.equal(`export interface View {
getFoo: (arg0: any) => ArrayLike<{foo: any[];}> & {};
bob: {tap: any;};
};`);
  });

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
            <div>[[a.d]]</div>
            <div>[[a.b.c]]</div>
        `)
      )
    ).to.deep.equal(`export interface View {
a: {d: any; b: {c: any;};};
};`);
  });

  it("handles function with nested props", () => {
    expect(
      printTree(
        astTreeFromString(`
            <div>[[a().z]]</div>
        `)
      )
    ).to.deep.equal(`export interface View {
a: () => {z: any;};
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

  it("handles dom-repeat as function when using child attrs", () => {
    expect(
      printTree(
        astTreeFromString(`
          <template is="dom-repeat" items="[[foo()]]">
            [[item.ok]]
          </template>
        `)
      )
    ).to.deep.equal(`export interface View {
foo: () => ArrayLike<{ok: any;}> & {};
};`);
  });

  it("handles dom-repeat and has child attrs", () => {
    expect(
      printTree(
        astTreeFromString(`
          <p>[[foo.p]]</p>
          <template is="dom-repeat" items="[[foo]]">
          </template>
        `)
      )
    ).to.deep.equal(`export interface View {
foo: ArrayLike<any> & {p: any;};
};`);
  });

  it("handles very nested dom-repeats", () => {
    expect(
      printTree(
        astTreeFromString(`
          <template is="dom-repeat" items="[[foo]]">
            <template is="dom-repeat" items="[[item.tap]]" as="bob">
              <template is="dom-repeat" items="[[bob.zap]]" as="next">
                [[next.foo(1, 2)]]
                <template is="dom-repeat" items="[[next.wow]]"></template>
              </template>
            </template>
          </template>
        `)
      )
    ).to.deep.equal(`export interface View {
foo: ArrayLike<{tap: ArrayLike<{zap: ArrayLike<{foo: (arg0: any, arg1: any) => any; wow: any[];}> & {};}> & {};}> & {};
};`);
  });

  it("handles nested dom-repeats", () => {
    expect(
      printTree(
        astTreeFromString(`
          <template is="dom-repeat" items="[[foo]]">
            [[item.wow]]
            <template is="dom-repeat" items="[[item.tap]]" as="bob">
              [[bob.name]]
            </template>
          </template>
        `)
      )
    ).to.deep.equal(`export interface View {
foo: ArrayLike<{wow: any; tap: ArrayLike<{name: any;}> & {};}> & {};
};`);
  });

  it("handles a dom-repeat case", () => {
    expect(
      printTree(
        astTreeFromString(`
        <p>[[foo.abc]]</p>
        <template is="dom-repeat" items="[[foo]]">
            <div>[[item.zap]]</div>
        </template>
        <template is="dom-repeat" items="[[foo]]">
            <div>[[item.tap]]</div>
        </template>
        `)
      )
    ).to.deep.equal(`export interface View {
foo: ArrayLike<{zap: any; tap: any;}> & {abc: any;};
};`);
  });
});
