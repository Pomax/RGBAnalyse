(function() {
  "use strict";

  module.exports = {
    π: Math.PI,
    τ: 2*Math.PI,

    /**
     * Set default values if not found in an options object
     */
    setDefaults: function(options, defaults) {
      Object.keys(defaults).forEach(function(key) {
        options[key] = (typeof options[key] === "undefined") ? defaults[key] : options[key];
      });
    },

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
     * Generate RGB values (S/L not used atm)
     * H in range [0, 6.28]
     */
    computeRGB: function computeRGB(H,S,L) {
      H *= (6/this.τ);
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
    getDominantHues: function getDominantHue(hues, options) {
      options = options || {};
      var k = options.smoothing || 5;
      var interval = 1 + 2*k;
      var len = hues.length;
      var max = 0;
      var idx = 0;
      var sum, i, j;

      // smooth data
      var smoothed = [];
      for(i=0; i<len; i++) {
        sum = 0;
        for(j=-k; j<k; j++) { sum += hues[(len+i+j)%len]; }
        if(sum > max) { max = sum; idx = i; }
        smoothed[i] = sum/interval;
      }

      // simple bypass-derivative scan for dominant hues
      var derivative = [], p, n;
      for(i=0; i<len; i++) {
        p = hues[(i-1)%len];
        n = hues[(i+1)%len];
        derivative[i] = (n<p) ? -1 : 1;
      }

      // find dominant hues
      var dominant = [], l, c, color, d = options.distance/100;
      for(i=0; i<len; i++) {
        p = derivative[(i-1)%len];
        c = derivative[i];
        if(p>0 && c<0) {
          color = { H: i/100, strength: hues[i] };
          if (dominant.length === 0 || color.H - l.H >= d) {
            dominant.push(color);
            l = color;
          }
        }
      }

      // find 5 most dominant hues
      return dominant.sort(function(a,b) {
        a = a.strength;
        b = b.strength;
        return b-a;
      }).slice(0,5);
    },

    /**
     * If browser, use canvas to deal with an Image(). If node,
     * load image data from file. Note that the browser version
     * can take both an Image or a Canvas element as "img" input,
     * because you might load images through JS decoders in the
     * browser to circumvent incorrect application of color profiles.
     */
    getImageData: (function() {
      if(typeof window === "undefined") return require("./getimagedata");

      return function(img, handler) {
        if(img.width === 0) {
          var fn = function() {
            this.getImageData(img, handler);
          }.bind(this);
          return setTimeout(fn, 100);
        }
        
        if(img instanceof HTMLCanvasElement) {
          img = { src: img.toDataURL("image/png") };
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
          handler(false, {
            height: canvas.height,
            width: canvas.width,
            data: data
          });
        } catch (e) { handler(e, false); }
      };
    }()),

    /**
     *
     */
    getCanvasData: function(context) {
      var c = context.canvas;
      return context.getImageData(0,0,c.width,c.height);
    }

  };

}());
