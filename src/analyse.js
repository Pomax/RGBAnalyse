/**
 *
 */
module.exports = function analyse(img, options, defaults, callback) {
  "use strict";

  var common = require("./common");
  common.setDefaults(options, defaults);
  var ciemodels = require("./ciemodels");
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
    var r, g, b, M, R, G, B, hsl, H, i, v;
    var XYZ, Lab;

    var Cimage = common.generateCanvas(img.width, img.height);
    var Cdata = common.getCanvasData(Cimage);
    var Cpixels = Cdata.data;

    function neutral(r,g,b) {
      var m = (r+b+g)/3,
          c = Math.abs(r-m) < options.neutrals,
          d = Math.abs(g-m) < options.neutrals,
          e = Math.abs(b-m) < options.neutrals;
      return c && d && e;
    }

    function analyse(r,g,b,a) {
      // rgb histogram data:
      red[r]++;
      green[g]++;
      blue[b]++;

      // normalised rgb data:
      M = neutral(r,g,b) ? 0 : common.max3(r,g,b) * 3;
      R = M < 4 ? 1/3 : r/M;
      G = M < 4 ? 1/3 : g/M;
      B = M < 4 ? 1/3 : b/M;

      // normalised rgb histogram data:
      RED[(R*100)|0]++;
      GREEN[(G*100)|0]++;
      BLUE[(B*100)|0]++;

      if(options.computeLab) {
        //Observer = 2°, Illuminant = D65\
        XYZ = ciemodels.toXYZ("sRGB", R,G,B);
        Lab = ciemodels.toLab(XYZ.X, XYZ.Y, XYZ.Z);
      }

      // hsl data:
      hsl = common.computeHSL(R,G,B);
      if(hsl.C > 0) {
        hue[(100*hsl.H)|0]++;
      }
    }

    // aggregate all the interesting data
    for(i=0; i<len; i+=4) {
      analyse(data[i], data[i+1], data[i+2], data[i+3]);
      v = Math.min(hsl.C*255,255);
      var moo = common.computeRGB(hsl.H, hsl.S, hsl.L);
      Cpixels[i]   = v === 0 ? 255 : moo.r;
      Cpixels[i+1] = v === 0 ? 255 : moo.g;
      Cpixels[i+2] = v === 0 ? 255 : moo.b;
      Cpixels[i+3] = 255;
    }

    try { Cimage.putImageData(Cdata, 0, 0); } catch (e) { console.error(e); }

    var Lcanvas = Cimage.canvas;
    Lcanvas.setAttribute("class", "demo");

    var d = common.getDominantHue(hue, options);

    callback(false, {
      rgb: { r:red, g:green, b:blue },
      RGB: { r:RED, g:GREEN, b:BLUE },
      hsl: { h:hue, s:false, l:false, c:false, dominant: d },
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
      },
      lab : Lcanvas
    });

  });

};
