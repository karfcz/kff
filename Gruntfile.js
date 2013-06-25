module.exports = function(grunt) {

	// Project configuration.
	grunt.initConfig({
		concat: {
			kff: {
				src: [
					'./src/kff-prologue',
					'./src/kff.js',
					'./src/kff.Events.js',
					'./src/kff.List.js',
					'./src/kff.Collection.js',
					'./src/kff.Model.js',
					'./src/kff.ServiceContainer.js',
					'./src/kff.View.js',
					'./src/kff.PageView.js',
					'./src/kff.BinderMap.js',
					'./src/kff.BindingView.js',
					'./src/kff.BindingView.helpers.js',
					'./src/kff.Binder.js',
					'./src/binders/kff.EventBinder.js',
					'./src/binders/kff.AttrBinder.js',
					'./src/binders/kff.CheckBinder.js',
					'./src/binders/kff.DisabledBinder.js',
					'./src/binders/kff.ClassBinder.js',
					'./src/binders/kff.StyleBinder.js',
					'./src/binders/kff.ClickBinder.js',
					'./src/binders/kff.DoubleClickBinder.js',
					'./src/binders/kff.FocusBinder.js',
					'./src/binders/kff.BlurBinder.js',
					'./src/binders/kff.FocusBlurBinder.js',
					'./src/binders/kff.HtmlBinder.js',
					'./src/binders/kff.RadioBinder.js',
					'./src/binders/kff.TextBinder.js',
					'./src/binders/kff.TemplateBinder.js',
					'./src/binders/kff.ValueBinder.js',
					'./src/kff.ValueBinder.js',
					'./src/kff.ViewFactory.js',
					'./src/kff.Route.js',
					'./src/kff.Router.js',
					'./src/kff.FrontController.js',
					'./src/kff.App.js',
					'./src/kff-epilogue'
				],
				dest: './build/kff-all.js'
			}
		},
		uglify: {
			options: {
				mangle: true
			},
			kff: {
				src: ['./build/kff-all.js'],
				dest: './build/kff-all.min.js'
			}
		},
		watch: {
	      	files: '<% concat.kff.src %>',
	      	tasks: 'concat min'
	    },
	    lint: {
			files: '<% concat.kff.sr %c>'
		},
		jshint: {
			options: {
				smarttabs: false
			}
		}
	});

	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	// Default task.
	grunt.registerTask('default', ['concat', 'uglify']);

};