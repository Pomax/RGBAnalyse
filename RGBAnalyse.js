(function() {

  var π = Math.PI, τ = 2*π;

  /**
   * analysis defaults
   */
  var defaults = {
    hueshift: 1,
    chromacutoff: 0.07,
  };

  function scale(v) {
    return Math.sqrt(v);
  }

  function create(tag) {
    return document.createElement(tag);
  }

  /**
   * Get a canvas2d compliant drawing surface
   */
  function generateCanvas(w,h) {
    var canvas = create('canvas');
    canvas.width = w;
    canvas.height = h;
    return canvas.getContext('2d');
  }

  /**
   * Generate a
   */
  function generateImage(src) {
    var img = new Image();
    img.src = src;
    return img;
  }

  /**
   * Turn a canvas2d compliant drawing surface into a PNG image
   */
  function toDataURL(surface) {
    return surface.canvas.toDataURL('image/png');
  }

  function avg(list) {
    var b=0, t=0;
    list.forEach(function(v,i) { b+=(v|0); t+=(v|0)*i; });
    return (t/b)|0;
  }

  function max(list) {
    list = list.slice()
               .filter(function(v) { return !isNaN(v); })
               .sort(function(a,b) { return (b|0)-(a|0); });
    while(list[0] > 2 * list[1]) { list.splice(0,1); }
    return list[0];
  }

  /**
   * Generate HSL + Chroma values
   */
  function computeHSL(R,G,B) {
    var M = Math.max(R,Math.max(G,B)),
        m = Math.min(R,Math.min(G,B)),
        α = (R - G/2 - B/2),
        β = Math.sqrt(0.75) * (G - B),
        H = Math.atan2(β, α),
        C = Math.sqrt(α*α + β*β) * 10/π,
        L = (M+m)/2,
        S = L >= 0.5 ? C/(2-2*L) : C/(2*L);
    while (H<0) H = (H+τ)%τ;
    return { α:α, β:β, H:H, S:S, L:L, C:C };
  }

  /**
   * Generate RGB values
   */
  function computeRGB(H,S,L) {
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
  }

  function generateArray(size, val) {
    return (new Array(size)).join('.').split('.').map(function(){ return val; });
  }

  /**
   * Generate histogram renderings
   */
  function generateVisualisation(imageData) {
    var result = {};

    result.spectrum = (function generateSpectralLines(imageData) {
      var hdim = 50;
      var hues = imageData.hsl.h;
      var hmax = imageData.maxima.H;
      var surface = generateCanvas(hues.length, hdim);
      hues.forEach(function(hue, index) {
        var rgb = computeRGB(index/100,100,100);
        surface.strokeStyle = "rgba("+rgb.r+","+rgb.g+","+rgb.b+","+(hue/hmax)+")";
        surface.beginPath();
        surface.moveTo(index, hdim);
        surface.lineTo(index, 0);
        surface.stroke();
        surface.closePath();
      });
      return toDataURL(surface);
    }(imageData));

    result.histogram = (function generateHistogram(imageData) {
      var channels = [
        {color: 'red',   data: imageData.rgb.r, pref:'255,0,0'},
        {color: 'green', data: imageData.rgb.g, pref:'0,255,0'},
        {color: 'blue',  data: imageData.rgb.b, pref:'0,0,255'}
      ];

      var dim = 256;
      var maxima = imageData.maxima;
      var max = scale( Math.max(maxima.r, Math.max(maxima.g, maxima.b)) );
      var surface = generateCanvas(dim, dim);
      channels.forEach(function(channel) {
        var cutoff = channel.cutoff;
        channel.data.forEach(function(v,idx) {
          surface.strokeStyle = "rgba(" + channel.pref + ","+(0.33 * (idx/255))+")";
          surface.beginPath();
          surface.moveTo(idx, dim);
          surface.lineTo(idx, dim - dim*scale(v)/max);
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

      return toDataURL(surface);
    }(imageData));

    return result;
  }

  /**
   *
   */
  function RGBAnalyse(img) {

    var getImageData = defaults.getImageData || function(img) {
      // place the image for processing
      var nimg = new Image();
      nimg.src = img.src;
      img = nimg;
      var canvas = create('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      var ctx = canvas.getContext('2d');
      ctx.drawImage(img,0,0);
      return ctx.getImageData(0,0,canvas.width,canvas.height).data;
    };

    /**
     * Generate histogram data
     */
    function analyse(img) {
      var data = getImageData(img);
      if(!data) { return console.error("error: locked or empty image:", img); }
      var len = data.length;

      // set up histogram containers
      var red    = generateArray(256,0);
      var green  = red.slice();
      var blue   = red.slice();
      var RED    = generateArray(101,0);
      var GREEN  = RED.slice();
      var BLUE   = GREEN.slice();
      var hue    = generateArray((100*τ)|0, 0);
      var r, g, b, M, R, G, B, hsl, H, i;

      // iterate over all pixels
      for(i=0; i<len; i+=4) {
        // rgb data:
        r = data[i];
        g = data[i+1];
        b = data[i+2];
        // rgb histogram data:
        red[r]++;
        green[g]++;
        blue[b]++;
        // RGB data:
        M = Math.max(r,Math.max(g,b)) * 3;
        R = r/M;
        G = g/M;
        B = b/M;
        // RGB histogram data:
        RED[(R*100)|0]++;
        GREEN[(G*100)|0]++;
        BLUE[(B*100)|0]++;
        // hsl data:
        hsl = computeHSL(R,G,B);
        // hue histogram:
        if(hsl.C > defaults.chromacutoff) {
          hue[(100*hsl.H)|0]++;
        }
      }

      var RGBAnalysis = window.RGBAnalysis = {
        rgb: { r:red, g:green, b:blue },
        RGB: { r:RED, g:GREEN, b:BLUE },
        hsl: { h:hue, s:false, l:false, c:false },
        average: {
          r:avg(red),
          g:avg(green),
          b:avg(blue),
          R:avg(RED),
          G:avg(GREEN),
          B:avg(BLUE),
          H:avg(hue)
        },
        maxima: {
          r:max(red),
          g:max(green),
          b:max(blue),
          R:max(RED),
          G:max(GREEN),
          B:max(BLUE),
          H:max(hue)
        }
      };

      return RGBAnalysis;
    }

    return analyse(img);
  }

  /**
   *
   */
  function getDominantHue(hues) {
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
  }

  function showAndTell(img, idx) {
    var analysis = RGBAnalyse(img);
    img.RGBAnalysis = analysis;

    var hues = analysis.hsl.h,
        dominant = getDominantHue(hues),
        rgb = computeRGB(dominant, 100 ,100),
        viz = generateVisualisation(analysis),
        surface = generateCanvas(300,300),
        histogram = viz.histogram,
        spectrum = viz.spectrum,
        m1 = 50;

    // generate graphic
    (function(s) { with(s) {
      // histogram
      drawImage(generateImage(histogram), 0,0,300,300-m1);
      // dominant hue
      fillStyle = "rgb("+rgb.r+","+rgb.g+","+rgb.b+")";
      for(var i=0,t=100;i<t;i++) {
        fillStyle = "rgba("+rgb.r+","+rgb.g+","+rgb.b+","+(1-Math.sqrt(i/t))+")";
        fillRect(0,i,300,1);
      }
      // spectral analysis
      fillStyle = "#000";
      fillRect(0,300-m1,300,m1);
      drawImage(generateImage(spectrum), 0,300-m1,300,m1);
      moveTo(0,300);
      lineTo(300,300);
      stroke();
    }}(surface))

    analysis.hsl.dominant = dominant;
    analysis.graphic = toDataURL(surface);
  }

  AnalysisObject = {
      analyse: RGBAnalyse,
      generateVisualisation: generateVisualisation
    };

  // require.js
  if(typeof define !== "undefined" && define.amd) {
    define(function() { return AnalysisObject; });
  }

  // node.js
  else if(typeof module !== "undefined" && module.exports) {
    module.exports = AnalysisObject;
  }

  // browser
  else {
    AnalysisObject.showAndTell = function(e, show) {
      var imgs;
      if(e instanceof HTMLElement) {
        imgs = [e];
      } else {
        imgs = Array.prototype.slice.call(document.querySelectorAll(e));
      }
      imgs.forEach(showAndTell);
      imgs.sort(function(a,b) {
        if(!a.RGBAnalysis || !b.RGBAnalysis) return 0;
        a = (a.RGBAnalysis.hsl.dominant + defaults.hueshift) % 6;
        b = (b.RGBAnalysis.hsl.dominant + defaults.hueshift) % 6;
        return a - b;
      });
      if(typeof show === "undefined" || show===true) {
        imgs.forEach(function(img) {
          var newImg = new Image();
          newImg.src = img.src;
          document.body.appendChild(newImg);
          newImg = new Image();
          newImg.src = img.RGBAnalysis.graphic;
          newImg.classList.add("RGBAnalysis");
          document.body.appendChild(newImg);
        })
      };
      return imgs;
    };
    window.RGBAnalyse = AnalysisObject;
  }

}());
