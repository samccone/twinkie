import { expect } from "chai";
import { nodesToTree } from "./ast_tree_builder";
import { walkNodes } from "./dom_walker";
import * as Cheerio from "cheerio";
import { AliasMap, AST_NODE, EXPRESSION } from "./types";
import { getExpressionsForNode } from "./ast_builder";

function stringToNodes(html: string) {
  const parsed = Cheerio.parseHTML(html);
  const aliasMap: AliasMap = {};
  const nodes: AST_NODE[] = [];

  parsed.forEach(node => {
    walkNodes(node, aliasMap, (node: CheerioElement, aliasMap: AliasMap) => {
      nodes.push(...getExpressionsForNode(node, aliasMap));
    });
  });

  return nodes;
}

describe("ast tree building", () => {
  // nested dom-repeat case would be nice to add here

  it("ignores style tags", () => {
    const nodes = stringToNodes(`<style>[[wow]]</style>`);

    expect(nodesToTree(nodes)).to.deep.equal({});
  });

  it("ignores script tags", () => {
    const nodes = stringToNodes(`<script>[[wow]]</script>`);

    expect(nodesToTree(nodes)).to.deep.equal({});
  });

  it("handles a dom-repeat as function with child", () => {
    const nodes = stringToNodes(
      `<template is="dom-repeat" items="[[wow()]]">[[item.zap]]</template>`
    );

    expect(nodesToTree(nodes)).to.deep.equal({
      wow: {
        expression: "wow",
        type: EXPRESSION.FUNCTION,
        returnType: EXPRESSION.LIST,
        argumentCount: 0,
        children: {},
        listIndexType: {
          zap: {
            children: {},
            expression: "zap",
            type: EXPRESSION.VALUE
          }
        }
      }
    });
  });
  it("handles a iron-list as function with child", () => {
    const nodes = stringToNodes(
      `<iron-list items="[[wow()]]">[[item.zap]]</iron-list>`
    );

    expect(nodesToTree(nodes)).to.deep.equal({
      wow: {
        expression: "wow",
        type: EXPRESSION.FUNCTION,
        returnType: EXPRESSION.LIST,
        argumentCount: 0,
        children: {},
        listIndexType: {
          zap: {
            children: {},
            expression: "zap",
            type: EXPRESSION.VALUE
          }
        }
      }
    });
  });

  it("handles dom-repeat nodes", () => {
    const nodes = stringToNodes(`
        <dom-module id="nest">
            <template>
                <template is="dom-repeat" items="[[foo]]">
                  [[foo.name]]
                  <template is="dom-repeat" items="[[foo.cows]]">
                  </template>
                </template>
            </template>
        </dom-module>`);

    expect(nodesToTree(nodes)).to.deep.eq({
      foo: {
        children: {
          name: {
            children: {},
            expression: "name",
            type: EXPRESSION.VALUE
          },
          cows: {
            children: {},
            expression: "cows",
            type: EXPRESSION.LIST
          }
        },
        expression: "foo",
        type: EXPRESSION.LIST
      }
    });
  });

  it("handles nested nodes", () => {
    const nodes = stringToNodes(`
        <dom-module id="nest">
            <template>
                <p>[[a]]</p>
                <p>[[b.z]]</p>
                <p>[[b.a.c(a, z).t]]</p>
            </template>
        </dom-module>`);

    expect(nodesToTree(nodes)).to.deep.eq({
      a: {
        expression: "a",
        children: {},
        type: EXPRESSION.VALUE
      },
      b: {
        expression: "b",
        type: EXPRESSION.VALUE,
        children: {
          z: {
            children: {},
            expression: "z",
            type: EXPRESSION.VALUE
          },
          a: {
            children: {
              c: {
                children: {
                  t: {
                    children: {},
                    expression: "t",
                    type: EXPRESSION.VALUE
                  }
                },
                expression: "c",
                type: EXPRESSION.FUNCTION,
                argumentCount: 2,
                returnType: EXPRESSION.VALUE
              }
            },
            expression: "a",
            type: EXPRESSION.VALUE
          }
        }
      },
      z: {
        expression: "z",
        children: {},
        type: EXPRESSION.VALUE
      }
    });
  });
});
