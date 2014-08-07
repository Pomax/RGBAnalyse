(function() {
  "use strict";

  var inbrowser = (typeof window !== "undefined");
  var common = require("./common");

  function hslVisualization(imageData) {
    var hdim = 200;
    var sdim = 50;
    var hues = imageData.hsl.h;
    var hmax = imageData.maxima.H;
    var histogram = common.generateCanvas(hues.length, hdim);
    var spectogram = common.generateCanvas(hues.length, sdim);
    hues.forEach(function(hue, index) {
      var rgb = common.computeRGB(index/100,100,100);

      histogram.strokeStyle = "rgb("+rgb.r+","+rgb.g+","+rgb.b+")";
      histogram.beginPath();
      histogram.moveTo(index, hdim);
      histogram.lineTo(index, hdim - hdim*(hue/hmax));
      histogram.stroke();
      histogram.closePath();

      spectogram.strokeStyle = "rgba("+rgb.r+","+rgb.g+","+rgb.b+","+(hue/hmax)+")";
      spectogram.beginPath();
      spectogram.moveTo(index, sdim);
      spectogram.lineTo(index, 0);
      spectogram.stroke();
      spectogram.closePath();
    });

    return {
      spectogram: common.toDataURL(spectogram),
      histogram: common.toDataURL(histogram)
    };
  }

  function rgbVisualization(imageData) {
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
      spectrum: hslVisualization(imageData),
      histogram: rgbVisualization(imageData)
    };
  };

}());
