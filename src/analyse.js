/**
 *
 */
module.exports = function analyse(img, options, defaults, callback) {
  "use strict";

  var common = require("./common");
  var generateVisualization = require("./generate");

  common.getImageData(img, function(err, data) {

    if(!data) {
      return setTimeout(function() {
        callback(new Error("error: locked or empty image:"));
      },0);
    }
    var len = data.length;

    // set up histogram containers
    var red    = common.generateArray(256,0);
    var green  = red.slice();
    var blue   = red.slice();
    var RED    = common.generateArray(101,0);
    var GREEN  = RED.slice();
    var BLUE   = GREEN.slice();
    var hue    = common.generateArray((100*common.τ)|0, 0);
    var r, g, b, M, R, G, B, hsl, H, i;

    // aggregate all the interesting data
    for(i=0; i<len; i+=4) {

      // rgb data:
      r = data[i];
      g = data[i+1];
      b = data[i+2];

      // rgb histogram data:
      red[r]++;
      green[g]++;
      blue[b]++;

      // normalised rgb data:
      M = common.max3(r,g,b) * 3;
      R = r/M;
      G = g/M;
      B = b/M;

      // normalised rgb histogram data:
      RED[(R*100)|0]++;
      GREEN[(G*100)|0]++;
      BLUE[(B*100)|0]++;

      // hsl data:
      hsl = common.computeHSL(R,G,B);

      // hue histogram:
      if(hsl.C > defaults.chromacutoff) {
        hue[(100*hsl.H)|0]++;
      }

    }

    callback(false, {
      rgb: { r:red, g:green, b:blue },
      RGB: { r:RED, g:GREEN, b:BLUE },
      hsl: { h:hue, s:false, l:false, c:false },
      average: {
        r:common.avg(red),
        g:common.avg(green),
        b:common.avg(blue),
        R:common.avg(RED),
        G:common.avg(GREEN),
        B:common.avg(BLUE),
        H:common.avg(hue)
      },
      maxima: {
        r:common.max(red),
        g:common.max(green),
        b:common.max(blue),
        R:common.max(RED),
        G:common.max(GREEN),
        B:common.max(BLUE),
        H:common.max(hue)
      }
    });

  });

};
