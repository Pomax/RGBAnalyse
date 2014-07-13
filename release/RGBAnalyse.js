;(function(e,t,n){function i(n,s){if(!t[n]){if(!e[n]){var o=typeof require=="function"&&require;if(!s&&o)return o(n,!0);if(r)return r(n,!0);throw new Error("Cannot find module '"+n+"'")}var u=t[n]={exports:{}};e[n][0].call(u.exports,function(t){var r=e[n][1][t];return i(r?r:t)},u,u.exports)}return t[n].exports}var r=typeof require=="function"&&require;for(var s=0;s<n.length;s++)i(n[s]);return i})({1:[function(require,module,exports){
module.exports = (function() {
  var module = require("./src/RGBanalyse");
  if(typeof window !== "undefined" && !window.require && !window.define) {
    window.RGBAnalyse = module;
  }
  return module;
}());

},{"./src/RGBanalyse":2}],2:[function(require,module,exports){
/**
 * Single function API object. Call to `analyse` generates
 * an object with obj.analysis representing the obvious,
  */
(function() {
  "use strict";

  var RGBAnalyse = {
    defaults: {
      hueshift: 1,
      chromacutoff: 0.07
    },
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

},{"./analyse":3,"./generate":4}],3:[function(require,module,exports){
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

},{"./common":5,"./generate":4}],4:[function(require,module,exports){
(function() {
  "use strict";

  var common = require("./common");

  function generateSpectralLines(imageData) {
    var hdim = 50;
    var hues = imageData.hsl.h;
    var hmax = imageData.maxima.H;
    var surface = common.generateCanvas(hues.length, hdim);
    hues.forEach(function(hue, index) {
      var rgb = common.computeRGB(index/100,100,100);
      surface.strokeStyle = "rgba("+rgb.r+","+rgb.g+","+rgb.b+","+(hue/hmax)+")";
      surface.beginPath();
      surface.moveTo(index, hdim);
      surface.lineTo(index, 0);
      surface.stroke();
      surface.closePath();
    });
    return common.toDataURL(surface);
  }

  function generateHistogram(imageData) {
    var channels = [
      {color: 'red',   data: imageData.rgb.r, pref:'255,0,0'},
      {color: 'green', data: imageData.rgb.g, pref:'0,255,0'},
      {color: 'blue',  data: imageData.rgb.b, pref:'0,0,255'}
    ];

    var dim = 256;
    var maxima = imageData.maxima;
    var max = common.scale( common.max3(maxima.r, maxima.g, maxima.b) );
    var surface = common.generateCanvas(dim, dim);
    channels.forEach(function(channel) {
      var cutoff = channel.cutoff;
      channel.data.forEach(function(v,idx) {
        surface.strokeStyle = "rgba(" + channel.pref + ","+(0.33 * (idx/255))+")";
        surface.beginPath();
        surface.moveTo(idx, dim);
        surface.lineTo(idx, dim - dim*common.scale(v)/max);
        surface.stroke();
        surface.closePath();
      });
    });
    var pixelData = surface.getImageData(0,0,dim,dim);
    var pixels = pixelData.data, r,g,b,m,i,abs=Math.abs,t=40;
    for(i=pixels.length-1; i>0; i-=4) {
      r = pixels[i-3];
      g = pixels[i-2];
      b = pixels[i-1];
      m = ((r+b+g)/3)|0;
      if(abs(m-r)<t && abs(m-g)<t && abs(m-b)<t) {
        pixels[i-3] = 120;
        pixels[i-2] = 120;
        pixels[i-1] = 120;
      }
      pixels[i] = (pixels[i]+r+g+b < 10) ? 0 : 255 * (((i/4)%dim)/dim)|0;
    }
    surface.putImageData(pixelData,0,0);

    return common.toDataURL(surface);
  }

  /**
   * Generate histogram renderings
   */
  module.exports = function generateVisualisation(imageData) {
    return {
      spectrum: generateSpectralLines(imageData),
      histogram: generateHistogram(imageData)
    };
  };

}());

},{"./common":5}],5:[function(require,module,exports){
(function() {
  "use strict";

  module.exports = {
    π: Math.PI,
    τ: 2*Math.PI,

    /**
     *
     */
    scale: function scale(v) {
      return Math.sqrt(v);
    },

    /**
     *
     */
    create: function create(tag) {
      return document.createElement(tag);
    },

    /**
     * Get a canvas2d compliant drawing surface
     */
    generateCanvas: function generateCanvas(w,h) {
      var canvas = this.create('canvas');
      canvas.width = w;
      canvas.height = h;
      return canvas.getContext('2d');
    },

    /**
     * Generate a
     */
    generateImage: function generateImage(src) {
      var img = new Image();
      img.src = src;
      return img;
    },

    /**
     * Turn a canvas2d compliant drawing surface into a PNG image
     */
    toDataURL: function toDataURL(surface) {
      return surface.canvas.toDataURL('image/png');
    },

    /**
     *
     */
    avg: function avg(list) {
      var b=0, t=0;
      list.forEach(function(v,i) { b+=(v|0); t+=(v|0)*i; });
      return (t/b)|0;
    },

    /**
     *
     */
    max: function max(list) {
      list = list.slice()
                 .filter(function(v) { return !isNaN(v); })
                 .sort(function(a,b) { return (b|0)-(a|0); });
      while(list[0] > 2 * list[1]) { list.splice(0,1); }
      return list[0];
    },

    /**
     *
     */
    min3: function(a,b,c) {
      return Math.min(a,Math.min(b,c));
    },

    /**
     *
     */
    max3: function(a,b,c) {
      return Math.max(a,Math.max(b,c));
    },

    /**
     * Generate HSL + Chroma values
     */
    computeHSL: function computeHSL(R,G,B) {
      var M = this.max3(R,G,B),
          m = this.min3(R,G,B),
          α = (R - G/2 - B/2),
          β = Math.sqrt(0.75) * (G - B),
          H = Math.atan2(β, α),
          C = Math.sqrt(α*α + β*β) * 10/this.π,
          L = (M+m)/2,
          S = L >= 0.5 ? C/(2-2*L) : C/(2*L);
      while (H<0) H = (H+this.τ) % this.τ;
      return { α:α, β:β, H:H, S:S, L:L, C:C };
    },

    /**
     * Generate RGB values
     */
    computeRGB: function computeRGB(H,S,L) {
      var r = ((H < 1) ? 255           :
               (H < 2) ? (1-(H-1))*255 :
               (H < 4) ? 0             :
               (H < 5) ? (H-4)*255     : 255) | 0,
          g = ((H < 1) ? H*255         :
               (H < 3) ? 255           :
               (H < 4) ? (1-(H-3))*255 : 0) | 0,
          b = ((H < 2) ? 0             :
               (H < 3) ? (H-2)*255     :
               (H < 5) ? 255           : (1-(H-5))*255) | 0;
      return { r:r, g:g, b:b };
    },

    /**
     *
     */
    generateArray: function generateArray(size, val) {
      return (new Array(size)).join('.').split('.').map(function(){ return val; });
    },

    /**
     *
     */
    getDominantHue: function getDominantHue(hues) {
      var len = hues.length;
      var max = 0;
      var idx = 0;
      for(var i=0; i<hues.length; i++) {
        var sum = 0;
        for(j=-5; j<5; j++) {
          sum += hues[(len+i+j)%len];
        }
        if(sum > max) {
          max = sum;
          idx = i;
        }
      }
      return idx / 100;
    },

    /**
     *
     */
    getImageData: function(img, handler) {
      if(img.width === 0) {
        var fn = function() {
          this.getImageData(img, handler);
        }.bind(this);
        return setTimeout(fn, 100);
      }

      var nimg = new Image();
      nimg.src = img.src;
      img = nimg;
      var canvas = this.create('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      var ctx = canvas.getContext('2d');
      ctx.drawImage(img,0,0);
      try {
        var data = ctx.getImageData(0,0,canvas.width,canvas.height).data;
        handler(false, data);
      } catch (e) { handler(e, false); }
    }

  };

}());

},{}]},{},[1])
;