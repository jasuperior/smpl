/*global module*/
module.exports = function (grunt) {
    'use strict';

    grunt.loadNpmTasks('grunt-jasmine-node');
    grunt.loadNpmTasks('grunt-jslint');
    grunt.initConfig({
        jasmine_node: {
            unit: {
                src: [
                    'lib/',
                    'tests/'
                ]
            }
        },
        jslint: {
            all: {
                src: [
                    'Gruntfile.js',
                    'lib/**/*.js',
                    'package.json',
                    'tests/**/*.js'
                ],
                options: {
                    errorsOnly: true
                }
            }
        }
    });

    grunt.registerTask("default", [
        "jslint"
    ]);
    grunt.registerTask("test", [
        "default",
        "jasmine_node"
    ]);
};
