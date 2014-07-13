module.exports = (function() {
  var module = require("./src/RGBanalyse");
  if(typeof window !== "undefined" && !window.require && !window.define) {
    window.RGBAnalyse = module;
  }
  return module;
}());
