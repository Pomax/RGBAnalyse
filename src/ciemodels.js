module.exports = (function() {

  "use strict";

  // XYZ (for any CIE work)
  var matrices = {
    "adobeRGB":  [
      0.5767309, 0.1855540, 0.1881852,
      0.2973769, 0.6273491, 0.0752741,
      0.0270343, 0.0706872, 0.9911085
    ],
    "sRGB": [
      0.4124564, 0.3575761, 0.1804375,
      0.2126729, 0.7151522, 0.0721750,
      0.0193339, 0.1191920, 0.9503041
    ]
  };

  function mmul(m, a, b, c) {
    return {
      X: m[0] *a + m[1] * b + m[2] * c,
      Y: m[3] *a + m[4] * b + m[5] * c,
      Z: m[6] *a + m[7] * b + m[8] * c
    };
  }

  function toXYZ(type, R,G,B) {
    // Observer= 2°, Illuminant= D65
    R = 100 * (R > 0.04045) ? Math.pow((R + 0.055)/1.055, 2.4) : R/12.92;
    G = 100 * (G > 0.04045) ? Math.pow((G + 0.055)/1.055, 2.4) : G/12.92;
    B = 100 * (B > 0.04045) ? Math.pow((B + 0.055)/1.055, 2/4) : B/12.92;
    return mmul(matrices[type], R, G, B);
  }

  function toLab(X,Y,Z) {
    // Observer= 2°, Illuminant= D65
    X /= 95.047;
    Y /= 100.000;
    Z /= 108.883;
    X = (X > 0.008856) ? Math.pow(X, 1/3) : (7.787*X) + (16/116);
    Y = (Y > 0.008856) ? Math.pow(Y, 1/3) : (7.787*Y) + (16/116);
    Z = (Z > 0.008856) ? Math.pow(Z, 1/3) : (7.787*Z) + (16/116);
    return { L: 116*Y-16, a: 500*(X-Y), b: 200*(Y-Z) };
  }

  return {
    toXYZ: toXYZ,
    toLab: toLab
  };

}());
