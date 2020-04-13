const marked = require("marked");
const sanitizeHtml = require("sanitize-html");

function convertText(textIn) {
  return marked(
    fixBlockQuote(
      sanitizeHtml(textIn, {
        allowedTags: sanitizeHtml.defaults.allowedTags.concat(["tfoot"]),
      })
    ) || "*Text was scrubbed.*"
  );
}
exports.convertText = convertText;

function fixBlockQuote(textIn) {
  const regex = /&gt;/g;
  return textIn.replace(regex, ">");
}
exports.fixBlockQuote = fixBlockQuote;

function convertTitle(titleIn) {
  const options = {};
  return marked.inlineLexer(titleIn, [], options);
}
exports.convertTitle = convertTitle;
