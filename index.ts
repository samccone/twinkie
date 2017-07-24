import * as fs from "fs";
import * as Cheerio from "cheerio";
import { walkNodes } from "./dom_walker";
import { AliasMap, AST_NODE } from "./types";
import { getExpressionsForNode } from "./ast_builder";
import { nodesToTree } from "./ast_tree_builder";
import { printTree } from "./printer";

export function generateInterface(htmlPath: string) {
  const nodes: AST_NODE[] = [];
  const sample = fs.readFileSync(htmlPath, "utf-8");
  const parsed = Cheerio.parseHTML(sample);
  const aliasMap: AliasMap = {};

  parsed.forEach(node => {
    walkNodes(node, aliasMap, (node: CheerioElement, aliasMap: AliasMap) => {
      nodes.push(...getExpressionsForNode(node, aliasMap));
    });
  });

  console.log(printTree(nodesToTree(nodes)));
}
