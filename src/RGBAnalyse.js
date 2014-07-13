/**
 * Single function API object. Call to `analyse` generates
 * an object with obj.analysis representing the obvious,
  */
(function() {
  "use strict";

  var common = require("./common");

  var RGBAnalyse = {

    defaults: {
      hueshift: 1,
      chromacutoff: 0.07
    },

    computeRGB: common.computeRGB,

    computeHSL: common.computeHSL,

    analyse: function(img, options, callback) {
      if(options && !callback) {
        callback = options;
        options = {};
      }
      require("./analyse")(img, options, RGBAnalyse.defaults, function(err, analysis) {
        setTimeout(function() {
          callback(err, {
            analysis: analysis,
            visualization: require("./generate")(analysis)
          });
        },0);
      });
    }
  };

  module.exports = RGBAnalyse;
}());
