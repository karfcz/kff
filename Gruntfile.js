module.exports = function(grunt) {

	var jsFiles = [
		'./src/kff.polyfills.js',
		'./src/kff.base.js',
		'./src/kff.Dom.js',
		'./src/kff.Events.js',
		'./src/kff.Collection.js',
		'./src/kff.Model.js',
		'./src/kff.ModelPathWatcher.js',
		'./src/kff.ServiceContainer.js',
		'./src/kff.View.js',
		'./src/kff.PageView.js',
		'./src/kff.BinderMap.js',
		'./src/kff.BindingView.js',
		'./src/kff.BindingView.helpers.js',
		'./src/kff.Binder.js',
		'./src/kff.CollectionCountBinder.js',
		'./src/kff.CollectionBinder.js',
		'./src/kff.ModelView.js',
		'./src/binders/kff.EventBinder.js',
		'./src/binders/kff.AttrBinder.js',
		'./src/binders/kff.CheckBinder.js',
		'./src/binders/kff.DisabledBinder.js',
		'./src/binders/kff.ClassBinder.js',
		'./src/binders/kff.StyleBinder.js',
		'./src/binders/kff.ClickBinder.js',
		'./src/binders/kff.CallBinder.js',
		'./src/binders/kff.DoubleClickBinder.js',
		'./src/binders/kff.FocusBinder.js',
		'./src/binders/kff.BlurBinder.js',
		'./src/binders/kff.FocusBlurBinder.js',
		'./src/binders/kff.HtmlBinder.js',
		'./src/binders/kff.RadioBinder.js',
		'./src/binders/kff.TextBinder.js',
		'./src/binders/kff.TemplateBinder.js',
		'./src/binders/kff.ValueBinder.js',
		'./src/binders/kff.InsertBinder.js',
		'./src/kff.ValueBinder.js',
		'./src/kff.ViewFactory.js',
		'./src/kff.Route.js',
		'./src/kff.Router.js',
		'./src/kff.HashStateHandler.js',
		'./src/kff.FrontController.js',
		'./src/kff.App.js'
	];
	var allJsFiles = ['./src/kff-prologue'].concat(jsFiles).concat('./src/kff-epilogue');

	// Project configuration.
	grunt.initConfig({

		pkg: grunt.file.readJSON('package.json'),

		concat: {
			kff: {
				options: {
					banner: grunt.file.read('./src/kff-banner.js')
				},
				src: allJsFiles,
				dest: './build/kff.js'
			}
		},
		uglify: {
			options: {
				mangle: true,
				banner: grunt.file.read('./src/kff-banner.js'),
				report: 'gzip'
			},
			kff: {
				src: ['./build/kff.js'],
				dest: './build/kff.min.js'
			}
		},
		watch: {
			files: allJsFiles,
			tasks: 'concat'
		},
		jshint: {
			all: jsFiles,
			options: {
				smarttabs: false
			}
		},
		karma: {
			unit: {
				configFile: 'karma.conf.js'
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

	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-shell');
	grunt.loadNpmTasks('grunt-karma');

	grunt.registerTask('build', ['concat', 'uglify']);
	grunt.registerTask('docs', ['shell:docs']);
	grunt.registerTask('test', ['build', 'karma']);
	grunt.registerTask('default', ['build']);

};