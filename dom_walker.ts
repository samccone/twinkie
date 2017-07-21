import { AliasMap } from "./types";
import { isDomRepeat } from "./utils";
import { extractExpression } from "./expression_extractor";

export function extractNodeAttributes(node: CheerioElement) {
  const ret = [];
  for (const attrKey of Object.keys(node.attribs || {})) {
    ret.push({
      attributeKey: attrKey,
      attributeValue: node.attribs[attrKey]
    });
  }

  return ret;
}

export function extractNodeContents(node: CheerioElement) {
  if (node.type !== "comment" && node.nodeValue != null) {
    return node.nodeValue;
  }

  return null;
}

export function walkNodes(
  node: CheerioElement,
  aliasMap: AliasMap,
  fn: (node: CheerioElement, aliasMap: AliasMap) => void
) {
  if (node == null) {
    return;
  }

  fn(node, aliasMap);

  const aliasInPlace = isDomRepeat(node);
  let aliasName: string | undefined = undefined;

  if (aliasInPlace) {
    aliasName = node.attribs["as"] || "item";
    aliasMap[aliasName] = `${extractExpression(
      node.attribs["items"],
      aliasMap
    )[0]}[]`;
  }

  (node.childNodes || []).forEach(childNode => {
    walkNodes(childNode, aliasMap, fn);
  });

  if (aliasInPlace && aliasName !== undefined) {
    delete aliasMap[aliasName];
  }
}
