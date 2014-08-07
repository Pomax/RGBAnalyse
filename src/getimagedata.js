var fs = require("fs");
var PNG = require('pngjs').PNG;
var jpeg = require('jpeg-js');

function toArray(buffer) {
  var arr = [];
  for(var i=0, last=buffer.length; i<last; i++) {
    arr.push(buffer[i]);
  }
  return arr;
}

module.exports = function(filename, handler) {

	if(filename.indexOf(".png")!==-1) {
		fs.createReadStream(filename)
      .pipe(new PNG({filterType: 4}))
      .on('error', handler)
      .on('parsed', function() {
        handler(false, {
          height: this.height,
          width: this.width,
          data: toArray(this.data)
        });
      });
  }

  else if(filename.indexOf(".jpg")!==-1) {
    fs.readFile(filename, function(err, filedata) {
      if(err) return handler(err);
      var data = jpeg.decode(filedata);
      handler(false, {
        height: data.width,
        width: data.height,
        data: toArray(data.data)
      });
    });
  }

};
