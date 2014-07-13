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
      var sum, i, j;
      for(i=0; i<len; i++) {
        sum = 0;
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
