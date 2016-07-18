#! /usr/bin/env node
var v = require("vorpal")();
var gulp = require("gulp");
var concat = require("gulp-concat");
var duration = require("gulp-duration");
var watch = require("gulp-watch")
var fn = require("gulp-fn");
var compiler = require("../lib/dsl.js");
var fs = require("fs");
var pkg = require('../package.json');

/*var start = new Date();*/
process.on('SIGINT', function (){ process.exit(2) });
v.command("compile <dir>", "Parses the files at the given directory (node glob)")
    .alias("c")
    .alias("p")
    .option("-o, --output <dir>", "provide output directory for parsed files")
    .option("-m, --module <dir>", "add a module to the pipeline")
    .option("-c, --concat", "concatenate files into single filename provided")
    .option("-e --extension <ex>","change the file extension to the one provided")
    .option("-w --watch", "watches the files at the given input directory")
    .option ("-r --run", "compile script then run it in terminal")
    .option ("-d --debug", "exposes internal console.log calls")
    .action(function(a,cb){
        var d = duration("Compile Finished in");
        var loadModules = duration("Added Modules: ");
        var dir = a.dir, output = a.options.output || a.dir.replace(/(\\|\/)?(\*\*)?(\\|\/)(\*\.[\w_-]+)/, ""), modules = a.options.module, num = 0;
        if(a.options.debug) console.log(`Current Working Output Dir:: ${output}` );
        if(modules && !Array.isArray(modules)) modules = [modules];
        if(modules) modules.forEach(function(value){
                var file = fs.readFileSync(value, "utf8");
                compiler.compile(file);
                compiler.important();
        }.bind(this))
        if(modules){
            var converted = gulp.src(dir)
            .pipe(loadModules)
        }else {
            var converted = gulp.src(dir)
        }

        if(a.options.watch) {
            converted = converted.pipe(watch(a.dir))
        }

        converted.pipe(fn(function( file ){

            try{
            var str = file.contents.toString('utf8');
            var content = compiler.compile(" "+str, a.options.debug); ++num;
            }catch(e){
                var content = ""; ++num;
                console.log(`File [${file.path}] failed to parse :`)
                throw e;
            }

            file.contents = new Buffer(content);
            file.path = file.path.replace(/\.\w+$/, a.options.extension||".js");
            if(a.options.debug)
            console.log("\nCompile Finished:: ", file.path);
            compiler.reset();
            return file;
        }));

        if(a.options.concat){ converted = converted.pipe(concat(a.options.concat)) }
        if(a.options.run){
            converted.pipe(fn(function(file){
                var str = file.contents.toString("utf8");
                var run = new Function("",str);
                try{
                    run();
                }catch(e){
                    console.log(e);
                }
            }))
        }
        converted.pipe(d).pipe(gulp.dest(output));
        /*var end = new Date();
        this.log("Finished compiling "+num+" files in :: ", end-start, "ms");*/
        v.ui.cancel();
    })
    if(pkg.smpl){
        keys = Object.keys(pkg.smpl);
        keys.forEach(function(key){
            v.command(key, pkg.smpl[key]).action(function(a,cb){
                // console.log(`Parsing cmd  (${key}) :: `,  pkg.smpl[key]);
                v.execSync(pkg.smpl[key]);
            })
        });
        // console.log("Loaded Package Scripts :: ", keys.join(", "));
    }
//process arguments from the command line
v.parse(process.argv);
