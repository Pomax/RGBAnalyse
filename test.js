var RGBAnalyse = require("./index");

// match demonstrator settings in index.html
var options = {
	neutrals: 20,
	smoothing: 25,
	distance: 20
};

RGBAnalyse.analyse("images/img01.jpg", options, function(err, result) {
  console.log(result.analysis.hsl.dominant);
  result.analysis.hsl.dominant.forEach(function(c) {
    console.log( RGBAnalyse.computeRGB(c.H) );
  });
});
