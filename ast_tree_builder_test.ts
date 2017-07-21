import { expect } from "chai";
import { nodesToTree } from "./ast_tree_builder";
import { walkNodes } from "./dom_walker";
import * as Cheerio from "cheerio";
import { AliasMap, AST_NODE } from "./types";
import { getExpressionsForNode } from "./ast_builder";

describe("ast tree building", () => {
  it("handles a nested node with a function in the middle", () => {
    const parsed = Cheerio.parseHTML(`
        <dom-module id="nest">
            <template>
                <p>[[a]]</p>
                <p>[[b.z]]</p>
                <p>[[b.a.c(a, z).t]]</p>
            </template>
        </dom-module>
      `);
    const aliasMap: AliasMap = {};
    const nodes: AST_NODE[] = [];

    parsed.forEach(node => {
      walkNodes(node, aliasMap, (node: CheerioElement, aliasMap: AliasMap) => {
        nodes.push(...getExpressionsForNode(node, aliasMap));
      });
    });

    expect(nodesToTree(nodes)).to.deep.eq({
      a: {
        expression: "a",
        type: "value"
      },
      b: {
        expression: "b",
        type: "value",
        children: {
          z: {
            children: {},
            expression: "z",
            type: "value"
          },
          a: {
            children: {
              c: {
                children: {
                  t: {
                    children: {},
                    expression: "t",
                    type: "value"
                  }
                },
                expression: "c",
                type: "function",
                argumentCount: 2,
                returnType: "value"
              }
            },
            expression: "a",
            type: "value"
          }
        }
      },
      z: {
        expression: "z",
        type: "value"
      }
    });
  });
});
