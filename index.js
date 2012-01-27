var $ = require('seq');
var fs = require('fs');
var path = require('path');
var mkdirp = require('mkdirp');
var uglify = require("uglify-js");
var jsp = uglify.parser;
var pro = uglify.uglify;

exports.minify = function() {
	console.log('MINIFYING: ' + this.name);
  var inputPaths = this.prereqs;
  var outputPath = this.name;

	$(inputPaths)
	.seqMap(function (src) {
		loadAndMinify(src, this);
	})
	.unflatten()
	.seq(function(uglified) {
		this.vars.uglified = uglified;
		var cb = this;
		var dir = path.dirname(outputPath);

		fs.stat(dir, function (err, stat) {
			if (stat && stat.isDirectory()) {
				cb.ok();
			} else {
				// Target directory not found or not a directory,
				// try to create it.
				mkdirp(dir, 0755, function(err) {
					if (err) cb(err);
					else cb.ok();
				});
			}
		})
	})
	.seq(function() {
		var output = this.vars.uglified.join(';\n') + '\n';
		fs.writeFile(outputPath, output, this);
	})
	.seq(complete)
	.catch(function(err) {
		if (err) {
			fail(err.stack ?  err.stack : err.toString());
		}
	});
};


/**
 * Helper: Load and minify a file.
 *
 * @returns String Minified code
 */
function loadAndMinify(filename, callback) {
  fs.readFile(filename, 'utf8', function (err, src) {
		if (err) return callback(err);

		var res = pro.gen_code(pro.ast_squeeze(pro.ast_mangle(jsp.parse(src))));
		callback(null, res);
  });
};
