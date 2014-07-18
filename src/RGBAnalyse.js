/**
 * Single function API object. Call to `analyse` generates
 * an object with obj.analysis representing the obvious,
  */
(function() {
  "use strict";

  var common = require("./common");

  var RGBAnalyse = {

    defaults: {
      // hue curve smoothing interval (pixels from the center)
      smoothing: 5,
      // used for shifting the "starting hue" when sorting.
      hueshift: 1,
      // used in determine neutral colors (H has no meaning on them)
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
          if (err) {
            return callback(err);
          }
          callback(false, {
            analysis: analysis,
            visualization: require("./generate")(analysis)
          });
        },0);
      });
    }
  };

  module.exports = RGBAnalyse;
}());
