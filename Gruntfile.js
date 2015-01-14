/*global module:false*/
module.exports = function (grunt) {

    require('load-grunt-tasks')(grunt);
    var files = require('./files').files;

    // Project configuration.
    grunt.initConfig({
        builddir: 'build',
        pkg: grunt.file.readJSON('package.json'),
        buildtag: '-dev-' + grunt.template.today('yyyy-mm-dd'),
        meta: {
            banner: '/**\n' +
            ' * <%= pkg.description %>\n' +
            ' * @version v<%= pkg.version %><%= buildtag %>\n' +
            ' * @link <%= pkg.homepage %>\n' +
            ' * @license MIT License, http://www.opensource.org/licenses/MIT\n' +
            ' */'
        },
        clean: [ '<%= builddir %>' ],
        concat: {
            options: {
                banner: '<%= meta.banner %>\n\n'+
                '(function (window, angular, undefined) {\n',
                footer: '})(window, window.angular);'
            },
            build: {
                src: files.src,
                dest: '<%= builddir %>/<%= pkg.name %>.js'
            }
        },
        copy: {
            release: {
                files: [
                    {expand: true, flatten: true, src: ['<%= builddir %>/*'], dest: 'release/', filter: 'isFile' }
                ]
            }
        },
        uglify: {
            options: {
                banner: '<%= meta.banner %>\n'
            },
            build: {
                files: {
                    '<%= builddir %>/<%= pkg.name %>.min.js': ['<banner:meta.banner>', '<%= concat.build.dest %>']
                }
            }
        },
        release: {
            files: ['<%= pkg.name %>.js', '<%= pkg.name %>.min.js'],
            src: '<%= builddir %>',
            dest: 'release'
        },
        jshint: {
            all: ['Gruntfile.js', 'src/*.js', '<%= builddir %>/<%= pkg.name %>.js'],
            options: {
                eqnull: true
            }
        },
        watch: {
            files: ['src/*.js', 'specs/**/*.js'],
            tasks: ['build', 'karma:background:run']
        },
        connect: {
            server: {},
            sample: {
                options:{
                    port: 5555,
                    keepalive: true
                }
            }
        },
        karma: {
            options: {
                configFile: 'config/karma.js',
                singleRun: true,
                exclude: [],
                frameworks: ['jasmine'],
                reporters: 'dots', // 'dots' || 'progress'
                port: 8080,
                colors: true,
                autoWatch: false,
                autoWatchInterval: 0,
                browsers: [ grunt.option('browser') || 'PhantomJS' ]
            },
            unit: {
                browsers: [ grunt.option('browser') || 'PhantomJS' ]
            },
            debug: {
                singleRun: false,
                background: false,
                browsers: [ grunt.option('browser') || 'Chrome' ]
            },
            background: {
                background: true,
                browsers: [ grunt.option('browser') || 'PhantomJS' ]
            },
            watch: {
                configFile: 'config/karma.js',
                singleRun: false,
                autoWatch: true,
                autoWatchInterval: 1
            }
        },
        changelog: {
            options: {
                dest: 'CHANGELOG.md'
            }
        }
    });

    grunt.registerTask('integrate', ['build', 'jshint', 'karma:unit', 'karma:past', 'karma:unstable']);
    grunt.registerTask('default', ['build', 'jshint', 'karma:unit']);
    grunt.registerTask('build', 'Perform a normal build', ['concat', 'uglify']);
    grunt.registerTask('dist', 'Perform a clean build', ['clean', 'build']);
    grunt.registerTask('release', 'Build to release.', ['dist', 'copy:release']);
    grunt.registerTask('dev', 'Run dev server and watch for changes', ['build', 'connect:server', 'karma:background', 'watch']);
    grunt.registerTask('sample', 'Run connect server with keepalive:true for sample app development', ['connect:sample']);

    // Helpers for custom tasks, mainly around promises / exec
    var exec = require('faithful-exec'), shjs = require('shelljs');

};