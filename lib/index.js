#! /usr/bin/env node
var v = require("vorpal")();
var gulp = require("gulp");
var concat = require("gulp-concat");
var duration = require("gulp-duration");
var fn = require("gulp-fn");
var compiler = require("./dsl.js");
var ProgressBar = require('progress');

var bar = new ProgressBar('Compiling Document(s) [:bar] :percent', { total: 10 });
var fs = require("fs");
/*var start = new Date();*/
process.on('SIGINT', function (){ process.exit(2) });
v.command("compile <dir>", "Parses the files at the given directory (node glob)")
    .alias("c")
    .alias("p")
    .option("-o, --output <dir>", "provide output directory for parsed files")
    .option("-m, --module <dir>", "add a module to the pipeline")
    .option("-c, --concat", "concatenate files into single filename provided")
    .option("-e --extension <ex>","change the file extension to the one provided")
    .action(function(a,cb){
        var d = duration("Compile Finished in");
        var loadModules = duration("Added Modules: ");

        var dir = a.dir, output = a.options.output || "./", modules = a.options.module, num = 0;
        // console.log(a.options.output )
        if(modules && !Array.isArray(modules)) modules = [modules];
        if(modules) modules.forEach(function(value){
                bar.tick();
                var file = fs.readFileSync(value, "utf8");
                compiler.compile(file);
                bar.tick();
        }.bind(this))
        if(modules){
            var converted = gulp.src(dir)
            .pipe(loadModules)
            bar.tick();
        }else {
            var converted = gulp.src(dir)
            bar.tick();
        }

        converted.pipe(fn(function( file ){
            var str = file.contents.toString('utf8');
            var content = compiler.compile(str); ++num;
            bar.tick();
            file.contents = new Buffer(content);
            file.path = file.path.replace(/\.\w+$/, a.options.extension||".js");
            return file;
        }));
        if(a.options.concat){ converted = converted.pipe(concat(a.options.concat)); bar.tick() }
        converted.pipe(d).pipe(gulp.dest(output));
        bar.complete();
        /*var end = new Date();
        this.log("Finished compiling "+num+" files in :: ", end-start, "ms");*/
        v.ui.cancel();
    })

//process arguments from the command line
v.parse(process.argv);
