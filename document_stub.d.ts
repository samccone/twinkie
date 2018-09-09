// Cheerio documents behave a lot like cheerio elements, but they're not
// typed the same, probably because Cheerio's typings expect it to be used
// with dom typings, but we're in node!
interface Document extends CheerioElement {

}
