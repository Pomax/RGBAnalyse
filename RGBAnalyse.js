(function() {

  var RGBAnalyse = (function setupRGBHAnalyse(create) {
    var π = Math.PI, τ = 2*π;

    var defaults = {
      // these values effect cropping, and are
      // in dimension-ratio. E.g. x=0.5 is width/2
      xoffset: 0,
      yoffset: 0,
      width  : 1,
      height : 1,
      // these values effect perceptual correction
      cr: 1,
      cg: 1,
      cb: 1,
      // how high a solid 'hue' bar before gradient falldown
      barsize: 20,
      // how strong a gradient
      gradient: 0.2,
      // how fast a falloff
      falloff: 3,
      // which hue step ([0..6]) to treat as 'first'
      hueshift: 1,
      // below which chroma value is something hue-less?
      chromacutoff: 0.07,
      // histogram background color
      background: ''
    };

    /**
     * Sort a collection of images based on their dominant hue,
     * and show the rgb+h analysis in a nice little image alongside.
     *
     * for instance, use this bookmarklet on
     *
     *   http://www.gouletpens.com/Shop_All_Bottled_Ink_s/1106.htm?searching=Y&sort=7&cat=1106&brand=Noodler%27s&show=300&page=1
     *
     * with the query selector
     *
     *  .v65-productPhoto img
     *
     * Voila, superawesome coolness.
     *
     * - Pomax, http://twitter.com/TheRealPomax
     */
    function RGBAnalyse(imgs, options) {
      if (Array.prototype.slice.call(imgs).length === 0) { imgs = [imgs]; }
      imgs = Array.prototype.slice.call(imgs);
      options = options || {};

      Object.keys(defaults).forEach(function(key) {
        options[key] = options[key] || defaults[key];
      });

      /**
       * Generate histogram data
       */
      function getHue(img) {
        // place the image for processing
        var nimg = new Image();
        nimg.src = img.src;
        img = nimg;

        var canvas = create('canvas');
        canvas.width = img.width * options.width;
        canvas.height = img.height * options.height;
        var ctx = canvas.getContext('2d');
        ctx.drawImage(img,
          -(img.width  * options.xoffset),
          -(img.height * options.yoffset),
           img.width  * options.width,
           img.height * options.height
        );

        // iterate over all pixels
        var r,g,b,i,last,ra=0,ga=0,ba=0;
        var dim = 255;
        var red   = (new Array(255)).join('.').split('.').map(function(){return 0;});
        var green = red.slice();
        var blue  = red.slice();
        var data = ctx.getImageData(0,0,canvas.width,canvas.height).data;
        var len = data.length;
        for(i=0; i<len; i+=4) {
          r = data[i];
          g = data[i+1];
          b = data[i+2];
          a = data[i+3];
          red[r]++;
          green[g]++;
          blue[b]++;
          ra += r;
          ga += g;
          ba += b;
        };

        ra *= options.cr;
        ga *= options.cg;
        ba *= options.cb;

        var max = (function(input) {
          input = input.sort(function(a,b) { return (b|0) - (a|0); });
          while(input[0] > 2 * input[4]) { input.splice(0,3); }
          return input[0];
        }(red.concat(green).concat(blue)));

        var result = {
              red: red,
              ra: ra,
              green: green,
              ga: ga,
              blue: blue,
              ba:ba,
              max: max
            },
            R,G,B,
            M = Math.max(ra,Math.max(ga,ba));

        R = ra / M;
        G = ga / M;
        B = ba / M;

        result.R = R;
        result.G = G;
        result.B = B;

        var α = (R - G/2 - B/2),
            β = Math.sqrt(0.75) * (G - B),
            H2 = Math.atan2(β, α),
            C2 = Math.sqrt(α*α + β*β);

        result.α = α;
        result.β = β;
        result.H = (H2 + τ) % τ;
        result.C = C2 * 10/π;

        return result;
      }

      /**
       * Generate histogram renderings
       */
      function generateVisualisation(img) {
        // analysis graphics
        var canvas = create('canvas');
        var dim = img.huedata.red.length;
        canvas.height = dim;
        canvas.width = dim;
        ctx = canvas.getContext('2d');

        // compute the RGB coordinate corresponding to the average hue
        var H = img.huedata.H,
            r = ((H < 1) ? 255           :
                 (H < 2) ? (1-(H-1))*255 :
                 (H < 4) ? 0             :
                 (H < 5) ? (H-5)*255     : 255) | 0,
            g = ((H < 1) ? H*255         :
                 (H < 3) ? 255           :
                 (H < 4) ? (1-(H-4))*255 : 0) | 0,
            b = ((H < 2) ? 0             :
                 (H < 3) ? (H-2)*255     :
                 (H < 5) ? 255           : (1-(H-5))*255) | 0;

        // store the RGB coordinate on the data object
        img.huedata.color = {r:r, g:g, b:b};

        // compute the RGB histogram
        var channels = [
          {color: 'red',   data: img.huedata.red,   pref:'255,0,0'},
          {color: 'green', data: img.huedata.green, pref:'0,255,0'},
          {color: 'blue',  data: img.huedata.blue,  pref:'0,0,255'}
        ];
        var max = img.huedata.max;
        channels.forEach(function(channel) {
          channel.data.forEach(function(v,idx) {
            ctx.strokeStyle = "rgba(" + channel.pref + ","+idx/255+")";
            ctx.beginPath();
            ctx.moveTo(idx, dim);
            ctx.lineTo(idx, dim - dim * v/max);
            ctx.stroke();
            ctx.closePath();
          });
        });

        // store the histogram on the data object
        var dataURL = canvas.toDataURL('image/png');
        var nf = 1000,
            Ha = ((nf*img.huedata.H)|0)/nf,
            Ca = ((nf*img.huedata.C)|0)/nf;
        img.setAttribute('data-hue',    Ha);
        img.setAttribute('data-chroma', Ca);
        if(Ca < options.chromacutoff) {
          img.setAttribute('data-neutral','neutral');
        }
        img.setAttribute('data-rgb', r+','+g+','+b);
        img.huedata.histogram = dataURL;
      }

      // process all images
      imgs.forEach(function(img) {
        img.huedata = getHue(img);
        generateVisualisation(img);
      });

      // sort images by hue
      imgs.sort(function(a,b) {
        a = (a.huedata.H + options.hueshift) % 6;
        b = (b.huedata.H + options.hueshift) % 6;
        return a - b;
      });

      // return processed, sorted list
      return imgs;
    };

    return RGBAnalyse;

  }(function(tag) { return document.createElement(tag); }));


  // require.js
  if(typeof define !== "undefined" && define.amd) {
    define(function() { return RGBAnalyse; });
  }

  // node.js
  else if(typeof module !== "undefined" && module.exports) {
    module.exports = RGBAnalyse;
  }

  // browser
  else { window.RGBAnalyse = RGBAnalyse; }

}());
