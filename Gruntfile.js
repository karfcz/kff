module.exports = function(grunt)
{

	// Project configuration.
	grunt.initConfig({

		pkg: grunt.file.readJSON('package.json'),

		browserify: {
			options: {},
			devwatch: {
				files: {
					'./build/kff.js': './src/main.js'
				},
				options: {
					transform: [
						['envify', {
							NODE_ENV: 'development'
						}]
					],
					browserifyOptions: {
						builtins: false,
						debug: true,
						fullPaths: false,
						standalone: 'kff'
					},
					watch: true,
					keepAlive: true
				}
			},
			dev: {
				files: {
					'./build/kff.js': './src/main.js'
				},
				options: {
					transform: [
						['envify', {
							NODE_ENV: 'development'
						}]
					],
					browserifyOptions: {
						builtins: false,
						debug: true,
						fullPaths: false,
						standalone: 'kff'
					},
					watch: false,
					keepAlive: false
				}
			},
			prod: {
				files: {
					'./build/kff.min.js': './src/main.js'
				},
				options: {
					transform: [
						['envify', {
							NODE_ENV: 'production'
						}]
					],
					browserifyOptions: {
						builtins: false,
						debug: false,
						fullPaths: false,
						standalone: 'kff'
					},
					plugin: [[ "browserify-derequire" ]],
					watch: false,
					keepAlive: false
				}
			},
		},

		uglify: {
			options: {
				mangle: true,
				dead_code: true,
				banner: grunt.file.read('./src/banner.js')
			},
			kff: {
				src: ['./build/kff.min.js'],
				dest: './build/kff.min.js'
			}
		},

		jshint: {
			all: './src/**/*.js',
			options: {
				smarttabs: false
			}
		},

		karma: {
			unit: {
				configFile: 'karma.conf.js',
				client: {
		            mocha: {
		                timeout: 5000
		            }
		        }
			}
		},

		shell: {
			docs: {
				options: {
					stderr: true
				},
				command: '"./node_modules/.bin/jsdoc" ./build/kff.js --destination ./docs'
			}
		}

	});

	grunt.loadNpmTasks('grunt-browserify');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-shell');
	grunt.loadNpmTasks('grunt-karma');

	grunt.registerTask('build', ['browserify:dev', 'browserify:prod', 'uglify']);
	grunt.registerTask('docs', ['shell:docs']);
	grunt.registerTask('test', ['build', 'karma']);
	grunt.registerTask('default', ['build']);
	grunt.registerTask('w', ['browserify:devwatch']);

};