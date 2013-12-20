Duster.js - Watch & precompile dust.js templates
=============

A simple Node script <a href="https://github.com/dmix/dusterjs">duster.js</a> to watch a directory of .dust templates and compile them into .js files which can be included into an HTML file.

## Why duster.js? Autocompile your templates to use dust.js in the browser
The dust.js documentation does not mentioned a clear way to work with dust templates in a purely client-side approach, instead focusing on server-side node.js applications.

For my backbone.js app, the only option was to include the dust-full.js file and compile the templates on each browser load. The file is much larger than the normal dust-core.js and this approach provides no extra value over other templating solutions (performance, browser caching, external file management etc).

So I wrote a script to pre-compile dust.js files whenever they are modified in a folder.

## Install

    npm install -g dusterjs

## Usage

The most simple usage: compile a bunch of templates (the *views* directory) into a single JS file (*templates.js*). Only files with the *.dust* extension will be compiled.

    $ duster views templates.js

To watch the input directories for changes and recompile, use the **--watch** (-w) option: 

    $ duster -w views templates.js

To generate one .js file per dust template, use the **--no-concat** option (for example, *views/home.dust* would become *views-js/home.js* and *views/shared/nav.dust* would become *views-js/shared/nav.js*):

    $ duster --no-concat views views-js

A complete list of options:

      --verbose, -v   verbose mode
      --watch, -w     watch input directory(s) for changes
      --concat, -c    concatenate all compiled templates into one javascript file (turn off with --no-concat)  [string]  [default: true]
      --minify, -m    minify all the compiled templates (turn off with --no-minify)                            [default: true]
      --interval, -i  set the polling interval (in milliseconds)                                               [default: 100]
      --help          show usage information and exit
      --version       show program version and exit

##  As a libary

Duster.js is now also available as a library.

### duster.compileFile (fileName, callback)

Passes to ```callback``` the JavaScript resulting from compiling the dust template.

### duster.compileFileSync (fileName)

Returns the JavaScript resulting from compiling the dust template.

### duster.minify (js)

Returns a minified version of ```js``` (a piece of JavaScript code). Uses ```uglifyjs```.

### duster.compileAll (inputs, output, options) 

Compiles all *.dust* templates in the array of directory names **inputs**, and writes them to **output** (which is either a file name or directory name, depending on whether or not ```options.concat``` is truthy). If ```options.minify``` is truthy, the javascript will be compressed. If ```options.concat``` is truthy, the javascript will all be written to one file (specified by **output**), otherwise each *.dust* template will get its own *.js* file in the directory specified by **output**.

If an error occurs, an *array of strings* is thrown. If no errors occur, an object is returned with the following properties:

    {
        bytesRead: 54983, // The total number of JavaScript bytes produced by compiling the dust templates
        bytesWritten: 46563 // The total number of JavaScript bytes after compressing
    }

### duster.watch (inputs, output, [options], [callback]) 

Watches each of the directories in **inputs** recursively for changes. If any files or directories are added, changed or removed, the output is recompiled. ```options``` is passed to ```compileAll```. ```callback``` should be a function taking two arguments; the first argument is the error (if an error occurred), the second argument is the result of compileAll.

    duster.watch(["views", "../views"], "js/templates.js", {}, function (err, results) {
        if (err) 
            return console.error("** Error:", err);
        console.log("Templates updated at", new Date().toLocaleTimeString());
    });

## TODO

 * It would be more efficient when using --watch and --no-concat to only compile the one file that has changed (currently, it recompiles them all).
 * It would also be more efficient to do this in general with --no-concat, by looking at timestamps.

##  More information

Linkedin wrote a dust.js tutorial: https://github.com/linkedin/dustjs/wiki/Dust-Tutorial

---
by Dan McGrady http://dmix.ca

