var babel = require('rollup-plugin-babel');
var uglify = require('rollup-plugin-uglify');
var replace = require('rollup-plugin-replace');

module.exports = function(grunt)
{
	grunt.initConfig({

		pkg: grunt.file.readJSON('package.json'),

		rollup: {
			cjs: {
				options: {
					format: 'cjs',
					moduleName: 'kff',
					moduleId: 'kff',
					exports: 'named',
					banner: grunt.file.read('./src/banner.js'),
					plugins: [
						babel({
							exclude: './node_modules/**'
						})
					]
				},
				files: {
					'./dist/kff-cjs.js': './src/entry-es.js'
				},
			},
			es: {
				options: {
					format: 'es',
					moduleName: 'kff',
					moduleId: 'kff',
					banner: grunt.file.read('./src/banner.js'),
					plugins: [
						babel({
							exclude: './node_modules/**'
						})
					]
				},
				files: {
					'./dist/kff-es.js': './src/entry-es.js'
				},
			},
			umd: {
				options: {
					format: 'umd',
					moduleName: 'kff',
					moduleId: 'kff',
					banner: grunt.file.read('./src/banner.js'),
					plugins: [
						replace({
							'process.env.NODE_ENV': JSON.stringify('production')
						}),
						babel({
							exclude: './node_modules/**'
						}),
					]
				},
				files: {
					'./dist/kff.js': './src/entry-umd.js'
				},
			},
			min: {
				options: {
					format: 'umd',
					moduleName: 'kff',
					moduleId: 'kff',
					banner: grunt.file.read('./src/banner.js'),
					plugins: [
						replace({
							'process.env.NODE_ENV': JSON.stringify('production')
						}),
						babel({
							exclude: './node_modules/**'
						}),
						uglify({
							output: {
								comments: (node, comment) => comment.type === 'comment2' ? comment.value.indexOf('License') !== -1 : undefined
							}
						})
					]
				},
				files: {
					'./dist/kff.min.js': './src/entry-umd.js'
				},
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
			options: {
				stderr: true
			},
			rollup: {
	            command: '"./node_modules/.bin/rollup" -c rollup-watch-config.js -o ./dist/kff-es.js -w'
	        }
		}

	});

	grunt.loadNpmTasks('grunt-rollup');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-shell');
	grunt.loadNpmTasks('grunt-karma');

	grunt.registerTask('build', ['rollup']);
	grunt.registerTask('test', ['build', 'karma']);
	grunt.registerTask('default', ['build']);
	grunt.registerTask('w', ['shell:rollup']);

};