#! /usr/bin/env node
var v = require("vorpal")();
var gulp = require("gulp");
var concat = require("gulp-concat");
var duration = require("gulp-duration");
var fn = require("gulp-fn");
var compiler = require("./dsl.js");
var fs = require("fs");
/*var start = new Date();*/
process.on('SIGINT', function (){ process.exit(2) });
v.command("compile <dir>", "Parses the files at the given directory (node glob)")
    .alias("c")
    .alias("p")
    .option("-o, --output", "provide output directory for parsed files")
    .option("-m, --module", "add a module to the pipeline")
    .option("-c, --concat", "concatenate files into single filename provided")
    .option("-e --extension","change the file extension to the one provided")
    .action(function(a,cb){
        var d = duration("Compile Finished in");
        var dir = a.dir, output = a.options.output || "./", modules = a.options.module, num = 0;
        if(modules && !Array.isArray(modules)) modules = [modules];
        if(modules) modules.forEach(function(value){
                var file = fs.readFileSync(value, "utf8");
                compiler.compile(file);
        }.bind(this))
        var converted = gulp.src(dir)
        .pipe(fn(function( file ){
            var str = file.contents.toString('utf8');
            var content = compiler.compile(str); ++num;
            file.contents = new Buffer(content);
            file.path = file.path.replace(/\.\w+$/, a.options.extension||".js");
            return file;
        }));
        if(a.options.concat){ converted = converted.pipe(concat(a.options.concat)) }
        converted.pipe(d).pipe(gulp.dest(output));
        /*var end = new Date();
        this.log("Finished compiling "+num+" files in :: ", end-start, "ms");*/
        v.ui.cancel();
    })

//process arguments from the command line
v.parse(process.argv);
