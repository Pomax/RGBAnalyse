module.exports = function( grunt ) {
  "use strict";

  grunt.initConfig({
    pkg: grunt.file.readJSON( "package.json" ),

    jshint: {
      options: {
        browser: true,
        globals: {
          window: true,
          document: true
        },
        "-W054": true,  // new Function() warning
        "-W079": true   // var redefinition warning
      },
      files: [
        "./*.js",
        "./src/**/*.js"
      ]
    }
  });

  grunt.loadNpmTasks( "grunt-contrib-jshint" );

  grunt.registerTask( "default", [ "jshint" ]);
};
