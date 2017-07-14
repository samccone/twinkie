const ONE_WAY_BINDING_REGEX = /\[\[(.*?)\]\]/;
const TWO_WAY_BINDING_REGEX = /\{\{(.*?)\}\}/;

export function extractExpression(str: string) {
  const ret: string[] = [];
  let startingIndex = 0;

  if (str.length === 0) {
    return ret;
  }

  while (true) {
    const substring = str.slice(startingIndex);
    const twoWayMatch = substring.match(TWO_WAY_BINDING_REGEX);
    const oneWayMatch = substring.match(ONE_WAY_BINDING_REGEX);

    if (
      oneWayMatch != null &&
      oneWayMatch.index !== undefined &&
      twoWayMatch != null &&
      twoWayMatch.index !== undefined
    ) {
      if (oneWayMatch.index < twoWayMatch.index) {
        ret.push(oneWayMatch[1]);
        startingIndex += oneWayMatch.index + oneWayMatch[0].length;
      } else {
        ret.push(twoWayMatch[1]);
        startingIndex += twoWayMatch.index + twoWayMatch[0].length;
      }

      continue;
    }

    if (oneWayMatch != null && oneWayMatch.index !== undefined) {
      ret.push(oneWayMatch[1]);
      startingIndex += oneWayMatch.index + oneWayMatch[0].length;
      continue;
    }

    if (twoWayMatch != null && twoWayMatch.index !== undefined) {
      ret.push(twoWayMatch[1]);
      startingIndex += twoWayMatch.index + twoWayMatch[0].length;
      continue;
    }

    // no more matches time to bail.
    break;
  }

  return ret;
}
