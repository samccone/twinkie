import { expect } from "chai";
import { nodesToTree } from "./ast_tree_builder";
import { walkNodes } from "./dom_walker";
import * as Cheerio from "cheerio";
import { AliasMap, AST_NODE } from "./types";
import { getExpressionsForNode } from "./ast_builder";
import { printTree, printUse } from "./printer";

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

describe("print use", () => {
  it("handles objects", () => {
    expect(
      printUse(
        astTreeFromString(`
        <p>[[b]]</p>
        <p>[[b.c]]</p>
        <p>[[b.c.d]]</p>
        <p>[[a.d]]</p>
        <p>[[a.f(1, 2, a.b)]]</p>
    `), 'FooView'
      ).trim()).to.deep.equal(
        `const viewInstance = {} as FooView
viewInstance.b!
viewInstance.b!.c!
viewInstance.b!.c!.d!
viewInstance.a!
viewInstance.a!.d!
viewInstance.a!.f!(null!, null!, null!)
viewInstance.a!.b!`.trim()
      )
  });

  it("handles arrays", () => {
    expect(
      printUse(
        astTreeFromString(`
      <template is="dom-repeat" items="[[items]]" index-as="zap">
        [[zap]]
        [[item.wow]]
        <template is="dom-repeat" items="[[item.foo]]">
          [[item.amaze]]
        </template>
      </template>
    `), 'FooView'
      ).trim()
    ).to.deep.equal(
      `const viewInstance = {} as FooView
viewInstance.items!.every
viewInstance.items![0]!.wow!
viewInstance.items![0]!.foo!.every
viewInstance.items![0]!.foo![0]!.amaze!
`.trim()
    )
  });
});

describe("printing", () => {
  it("handles index-as aliasing", () => {
    expect(
      printTree(
        astTreeFromString(`
      <template is="dom-repeat" items="[[items]]" index-as="zap">
        [[zap]]
      </template>
    `)
      )
    ).to.deep.equal(`export interface View {
items: null|undefined|ArrayLike<any|null|undefined>;
};`);
  });

  it("handles complex aliasing and nested loops", () => {
    expect(
      printTree(
        astTreeFromString(`
            <table id="changeList">
      <tr class=  "headerRow">
        <th class="topHeader keyboard"></th>
        <th class="topHeader star" hidden$="[[!showStar]]" hidden></th>
        <th class="topHeader number" hidden$="[[!showNumber]]" hidden>#</th>
        <template is="dom-repeat" items="[[changeTableColumns]]" as="item">
          <th class$="[[_lowerCase(item)]] topHeader"
              hidden$="[[isColumnHidden(item, visibleChangeTableColumns)]]">
            [[item]]
          </th>
        </template>
        <template is="dom-repeat" items="[[labelNames]]" as="labelName">
          <th class="topHeader label" title$="[[labelName]]">
            [[_computeLabelShortcut(labelName)]]
          </th>
        </template>
      </tr>
      <template is="dom-repeat" items="[[sections]]" as="changeSection"
          index-as="sectionIndex">
        <template is="dom-if" if="[[!changeSection.length]]"></template>
        <template is="dom-repeat" items="[[changeSection]]" as="change">
          <gr-change-list-item
              assigned$="[[_computeItemAssigned(account, change)]]"></gr-change-list-item>
        </template>
      </template>
    </table>
    `)
      )
    ).to.deep.equal(`export interface View {
showStar: any|null|undefined;
showNumber: any|null|undefined;
changeTableColumns: null|undefined|ArrayLike<any|null|undefined>;
_lowerCase: (arg0: any|null|undefined) => any|null|undefined;
isColumnHidden: (arg0: any|null|undefined, arg1: any|null|undefined) => any|null|undefined;
visibleChangeTableColumns: any|null|undefined;
labelNames: null|undefined|ArrayLike<any|null|undefined>;
_computeLabelShortcut: (arg0: any|null|undefined) => any|null|undefined;
sections: null|undefined|ArrayLike<null|undefined|ArrayLike<any|null|undefined>> & null|undefined|{};
_computeItemAssigned: (arg0: any|null|undefined, arg1: any|null|undefined) => any|null|undefined;
account: any|null|undefined;
};`);
  });

  it("handles multi-level dom-repeat aliasing", () => {
    expect(
      printTree(
        astTreeFromString(`
      <template is="dom-repeat" items="[[items]]" as="foos">
        <template is="dom-repeat" items="[[foos]]" as="zap">[[zap.tap]]</template>
      </template>`)
      )
    ).to.deep.equal(`export interface View {
items: null|undefined|ArrayLike<null|undefined|ArrayLike<null|undefined|{tap: any|null|undefined;}|null|undefined> & null|undefined|{}> & null|undefined|{};
};`);
  });

  it("handles 3-dimensional dom-repeat aliasing", () => {
    expect(
      printTree(
        astTreeFromString(`
      <template is="dom-repeat" items="[[items]]" as="foos">
        <template is="dom-repeat" items="[[foos]]" as="zaps">
          <template is="dom-repeat" items="[[zaps]]" as="tap">
            [[tap.a]]
          </template>
        </template>
      </template>`)
      )
    ).to.deep.equal(`export interface View {
items: null|undefined|ArrayLike<null|undefined|ArrayLike<null|undefined|ArrayLike<null|undefined|{a: any|null|undefined;}|null|undefined> & null|undefined|{}> & null|undefined|{}> & null|undefined|{};
};`);
  });

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
zap: null|undefined|ArrayLike<any|null|undefined>;
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
zap: null|undefined|ArrayLike<any|null|undefined>;
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
getFoo: (arg0: any|null|undefined) => null|undefined|ArrayLike<null|undefined|{foo: null|undefined|ArrayLike<any|null|undefined>;}|null|undefined> & null|undefined|{};
bob: null|undefined|{tap: any|null|undefined;};
};`);
  });

  it("handles a function on-* case", () => {
    expect(
      printTree(
        astTreeFromString(`
            <div on-z="wow">hi bobby</div>
        `)
      )
    ).to.deep.equal(`export interface View {
wow: (arg0: any|null|undefined) => any|null|undefined;
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
foo: () => null|undefined|ArrayLike<any|null|undefined>;
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
foo: null|undefined|ArrayLike<null|undefined|{tap: null|undefined|ArrayLike<null|undefined|{zap: null|undefined|ArrayLike<null|undefined|{foo: (arg0: any|null|undefined, arg1: any|null|undefined) => any|null|undefined; wow: null|undefined|ArrayLike<any|null|undefined>;}|null|undefined> & null|undefined|{};}|null|undefined> & null|undefined|{};}|null|undefined> & null|undefined|{};
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
