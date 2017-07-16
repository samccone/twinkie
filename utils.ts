const FUNCTION_MATCHER = /^(.*?)\((.*)\)$/;

export function isDomRepeat(node: CheerioElement) {
  return (
    node.tagName === "template" &&
    node.attribs["is"] === "dom-repeat" &&
    node.attribs["items"]
  );
}

export function isExpressionFunction(expression: string) {
  return expression.match(FUNCTION_MATCHER) != null;
}

export function getFunctionArguments(functionExpression: string) {
  const match = functionExpression.match(FUNCTION_MATCHER);

  if (match != null && match[2].length) {
    return match[2].split(",").map(v => v.trim());
  }

  return [];
}

export function getFunctionName(functionExpression: string) {
  const match = functionExpression.match(FUNCTION_MATCHER);

  if (match == null) {
    return null;
  }

  return match[1];
}
