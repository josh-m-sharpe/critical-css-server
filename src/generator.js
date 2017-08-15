var request     = require('request');
var bluebird    = require('bluebird');
var path        = require('path');
var criticalcss = require('criticalcss');
var penthouse   = require('penthouse');
var fs          = require('fs');
var tmpDir      = require('os').tmpdir();
var extend      = require('extend');
var https        = require('https');

var tmpPath = path.join(tmpDir, 'crit.css');
var forced = ['.is-logged-in', '.is-logged-out', '.right-off-canvas-menu'];

module.exports = function (){
  var me;

  me = {
    generate: bluebird.promisify(function (sourceUrl, cssUrl, options, callback) { // err, output
      try {
        options = extend({ forceInclude: forced, ignoreConsole: true }, options);

        request(cssUrl).pipe(fs.createWriteStream(tmpPath)).on('close', function() {
          criticalcss.getRules(tmpPath, function(err, output) {
            if (err) {
              callback(err);
            } else {
              console.log('Options:');
              console.log(options);
              // criticalcss.findCritical(sourceUrl, extend({ rules: JSON.parse(output) }, options), callback);
              console.log('penthouse');

              var file = fs.createWriteStream("tmp.css");

              var request = https.get(cssUrl, function(response) {
                response.pipe(file);

                penthouse({
                  url: sourceUrl,
                  css: 'tmp.css'
                }).
                then(function(criticalCss){
                  console.log(criticalCss);
                  callback(null, criticalCss);
                }).
                catch(function(err){
                  console.log(err);
                  callback(err);
                });
              });
            }
          });
        });
      } catch (err) {
        callback(err);
      }
    })
  };

  return me;
};
