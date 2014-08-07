RGBAnalyse
==========

An RGB-HC histogram library for same-origin images

demonstrator gh-page: http://pomax.github.io/RGBAnalyse

Client-side installation: simply grab the library from the release directory on github,
or use bower to install: `bower install rgbanalyse`.

Node package installation: `npm install rgbanalyse`.


API
---

The library sets up an object with the following properties/functions:

* `defaults` - a settings object with default values as analysis options.
* `analyse(img,[options])` - performs image analysis on an image element, with optional tweaks.
* `computeHSL(R,G,B)` - convert RGB to HSL (note this requires normalised RGB values).
* `computeRGB(H)` - convert HSL (no S/L right now) to RGB, H in range [0,6.28].
* `analyse(img,[options])` - convert HSL to rgb (plain {r,g,b}, using range [0,255]).

The defaults object can be set prior to running analyses, and currently supports the following properties:

* `neutrals` - 10 - integer from 0 to 255, indicating the how close together {r,g,b} coordinates must be to be considered neutral
* `smoothing` - 5 - used to smooth the hue spectrum when determining dominant hues. (value is distance from mean)
* `distance` - 10 - minimum distance between recording two hues to end up recorded as major hues (value can range from 0 to 628)

The analyse function returns a two property object. The first is the `analysis` property, which houses:

* `rgb` - A 3 component object with the histographical data for r, g and b.
* `RGB` - A 3 component object with the histographical data for R, G,a nd B.
* `hsl` - An object with the histographical data for h, and <code>.dominant</code>, a sorted array of {H,strength} major hues.
* `average` - the weighted averages for r, g, b, R, G, B, and h.
* `maxima` - the absolute maxima for r, g, b, R, G, B, and h.

The second is the `visualization` property, available only when using the libary in the browser, which houses image source data-uris for:

* `histogram` - a 256 x 256 combined rgb histogram
* `spectrum.histogram` - a 360 x 200 hues histogram
* `spectrum.spectogram` - a 360 x 50 spectrogram


LICNSE
------

This code is released as Public Domain code. In jurisdictions that do not recognise the public domain, this code is to be considered under an MIT license (http://opensource.org/licenses/MIT)
