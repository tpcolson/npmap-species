module.exports = function (grunt) {
	'use strict';

	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-requirejs');
	grunt.loadNpmTasks('grunt-jsdoc');

	grunt.initConfig({
		requirejs: {
			compile: {
				options: {
					useStrict: true,

					generateSourceMaps: true,
					preserveLicenseComments: false,

					include: ['vendor/almond/almond.js', 'main.js'],

					baseUrl: 'assets/js',
					out: 'assets/js/main.min.js',
					mainConfigFile: 'assets/js/main.js'
				}
			}
		},

		jsdoc: {
			dist: {
				src: ['assets/js/*.js'],
				options: {
					destination: 'doc'
				},
			}
		},

		watch: {
			scripts: {
				files: ['assets/js/*.js', 'assets/js/**/*.js'],
				tasks: ['requirejs'],
				options: {
					spawn: false
				}
			}
		}
	});
}
