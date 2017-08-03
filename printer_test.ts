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
  it("handles a function with a -1 param", () => {
    expect(
      printTree(
        astTreeFromString(`
          [[foo(-1)]]
        `)
      )
    ).to.deep.equal(`export interface View {
foo: (arg0: any|null|undefined) => any|null|undefined;
};`);
  });

  it("handles dom-repeat when using index", () => {
    expect(
      printTree(
        astTreeFromString(`
            <template is="dom-repeat" items="[[zap]]">
              [[index]]
            </template>
        `)
      )
    ).to.deep.equal(`export interface View {
zap: (any|null|undefined)[]|null|undefined;
};`);
  });

  it("handles dom-repeat when using index as function arg", () => {
    expect(
      printTree(
        astTreeFromString(`
            <template is="dom-repeat" items="[[zap]]">
              [[foo(index)]]
            </template>
        `)
      )
    ).to.deep.equal(`export interface View {
zap: (any|null|undefined)[]|null|undefined;
foo: (arg0: any|null|undefined) => any|null|undefined;
};`);
  });

  it("handles dom-repeat when alias value is used as an arg", () => {
    expect(
      printTree(
        astTreeFromString(`
            <template is="dom-repeat" items="[[zap]]">
              <p>[[someCall(item.foo)]]</p>
            </template>
        `)
      )
    ).to.deep.equal(`export interface View {
zap: null|undefined|ArrayLike<null|undefined|{foo: any|null|undefined;}|null|undefined> & null|undefined|{};
someCall: (arg0: any|null|undefined) => any|null|undefined;
};`);
  });
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
getFoo: (arg0: any|null|undefined) => null|undefined|ArrayLike<null|undefined|{foo: (any|null|undefined)[]|null|undefined;}|null|undefined> & null|undefined|{};
bob: null|undefined|{tap: any|null|undefined;};
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
a: any|null|undefined;
b: (arg0: any|null|undefined, arg1: any|null|undefined) => any|null|undefined;
c: any|null|undefined;
d: any|null|undefined;
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
a: null|undefined|{d: any|null|undefined; b: null|undefined|{c: any|null|undefined;};};
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
a: () => null|undefined|{z: any|null|undefined;};
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
foo: () => (any|null|undefined)[]|null|undefined;
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
foo: () => null|undefined|ArrayLike<null|undefined|{ok: any|null|undefined;}|null|undefined> & null|undefined|{};
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
foo: null|undefined|ArrayLike<any|null|undefined> & null|undefined|{p: any|null|undefined;};
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
foo: null|undefined|ArrayLike<null|undefined|{tap: null|undefined|ArrayLike<null|undefined|{zap: null|undefined|ArrayLike<null|undefined|{foo: (arg0: any|null|undefined, arg1: any|null|undefined) => any|null|undefined; wow: (any|null|undefined)[]|null|undefined;}|null|undefined> & null|undefined|{};}|null|undefined> & null|undefined|{};}|null|undefined> & null|undefined|{};
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
foo: null|undefined|ArrayLike<null|undefined|{wow: any|null|undefined; tap: null|undefined|ArrayLike<null|undefined|{name: any|null|undefined;}|null|undefined> & null|undefined|{};}|null|undefined> & null|undefined|{};
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
foo: null|undefined|ArrayLike<null|undefined|{zap: any|null|undefined; tap: any|null|undefined;}|null|undefined> & null|undefined|{abc: any|null|undefined;};
};`);
  });
});
