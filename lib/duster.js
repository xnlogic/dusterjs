var fs = require('node-fs'),
    path = require('path'),
    dust = require('dustjs-linkedin'),
    watch = require('watch'),
    uglify = require('uglify-js'),
    diveSync = require('diveSync'),
    colors = require('colors')

var compileFile = exports.compileFile = function (filePath, templateId, cb) {
    if (typeof templateId === 'function') {
        cb = templateId;
        templateId = path.basename(filePath, '.dust');
    }

    fs.readFile(filePath, function (err, data) {
        if (err)
            cb(err);

        try {
            cb(null, dust.compile(String(data), templateId));
        } catch (e) {
            cb(e);
        }
    });
}
   
var compileFileSync = exports.compileFileSync = function (filePath, templateId) {
    if (!templateId)
        templateId = path.basename(filePath, '.dust');

    var template = fs.readFileSync(filePath);
    return dust.compile(String(template), templateId);
}

var minify = exports.minify = function (js) {
    return uglify.minify(js, { fromString: true }).code;
    
    var ast = uglify.parse(js);
    ast.figure_out_scope();
    return ast.transform(uglify.Compressor({ warnings: false })).print_to_string();
}

var compileAll = exports.compileAll = function (inputPaths, outputPath, options) {
    options = options || {};

    var errors = [];
    var first = true;

    var bytesRead = 0;
    var bytesWritten = 0;

    inputPaths.forEach(function (p) {
        diveSync(p, function (err, file) {
            try {
                if (err)
                    throw err;
                
                if (file.match(/\.js$/i) && options["include-js"]) {
                    if (options.concat) {
                        fs.appendFileSync(outputPath, '\n');
                        var js = fs.readFileSync(file);
                        if (options.minify)
                            js = minify(js.toString());
                        fs.appendFileSync(outputPath, js);
                    } else {
                        file = path.relative(p, file);
                        var out = path.join(outputPath, file);
                        var dir = path.dirname(out);

                        if (options.verbose)
                            console.log("Writing", out);

                        fs.mkdirSync(dir, null, true);
                        fs.writeFileSync(out, js);
                    }
                    return;
                } else if (!file.match(/\.dust$/i)) {
                    return;
                }

                var js = compileFileSync(file);
                bytesRead += js.length;

                if (options.minify) {
                    js = minify(js);
                }

                if (options.concat) {
                    // Add a newline between files if not minifying (in case '//' comments mess things up)
                    if (!first && !minify)
                        js = "\n" + js;

                    bytesWritten += js.length;

                    if (first)
                        fs.writeFileSync(outputPath, js);
                    else
                        fs.appendFileSync(outputPath, js);

                    first = false;
                } else {
                    file = path.relative(p, file);
                    var out = path.join(outputPath, file);
                    var dir = path.dirname(out);
                    out = out.replace(/\.dust$/, '.js');

                    if (options.verbose)
                        console.log("Writing", out);

                    fs.mkdirSync(dir, null, true);
                    fs.writeFileSync(out, js);
                }
            } catch (e) {
                errors.push(file + ": " + e);
            }
        })
    })

    if (errors.length > 0)
        throw errors;
    
    return {
        bytesRead: bytesRead,
        bytesWritten: bytesWritten
    };
}

var doWatch = exports.watch = function (inputPaths, outputPath, options, callback) {
    if (typeof options === 'function') {
        callback = options;
        options = {}
    } else if (!options) {
        options = {}
    }

    function recompile(event) {
        return function (f, stat) {
            if (!stat.isFile() || f.match(/\.dust$/i) || (options["include-js"] && f.match(/\.js$/i))) {
                if (options.verbose)
                    console.log("File " + event + ":", f);
                
                try {
                    var results = compileAll(inputPaths, outputPath, options);
                    if (callback)
                        callback(null, results);
                } catch (e) {
                    if (callback)
                        [].concat(e).forEach(callback);
                }
            }
        }
    }

    inputPaths.forEach(function(p) {
        watch.createMonitor(p, {
            persistent: true,
            interval: options.interval || 100
        }, function(monitor) {
            if (options.verbose)
                console.error("Watching", p);
                
            monitor.on("created", recompile("created"));
            monitor.on("changed", recompile("changed"));
            monitor.on("removed", recompile("removed"));
        });
    })
}
