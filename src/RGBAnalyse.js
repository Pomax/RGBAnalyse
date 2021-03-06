/**
 * Single function API object. Call to `analyse` generates
 * an object with obj.analysis representing the obvious,
  */
(function() {
  "use strict";

  var inbrowser = (typeof window !== "undefined");
  var common = require("./common");
  var RGBAnalyse = {

    defaults: {
      // +/- interval for neutral colours
      neutrals: 10,
      // hue curve smoothing interval (pixels from the center)
      smoothing: 5,
      // minimum distance between dominant hues
      distance: 10
    },

    computeRGB: common.computeRGB.bind(common),

    computeHSL: common.computeHSL.bind(common),

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
            visualization: inbrowser ? require("./generate")(analysis) : undefined
          });
        },0);
      });
    }
  };

  module.exports = RGBAnalyse;
}());
