module.exports = function(grunt) {

	// Project configuration.
	grunt.initConfig({
		// browserify: {
		// 	"kff-all-bf.js": {
		// 		//requires: ['traverse'],
		// 		entries: ['kff.js', 'kff.*.js']
		// 		// prepend: ['<banner:meta.banner>'],
		// 		// append: [],
		// 		// hook: function (bundle) {
		// 		//   // Do something with bundle
		// 		// }
		// 	}
		// },
		concat: {
			kff: {
				src: [
					'./src/kff.js',
					'./src/kff.Events.js',
					//'./src/kff.LinkedList.js',
					'./src/kff.List.js',
					'./src/kff.Collection.js',
					'./src/kff.Model.js',
					'./src/kff.ServiceContainer.js',
					'./src/kff.View.js',
					'./src/kff.PageView.js',
					'./src/kff.BindingView.js',
					'./src/kff.Binder.js',
					'./src/binders/kff.*.js',
					'./src/kff.ValueBinder.js',
					'./src/kff.ViewFactory.js',
					'./src/kff.Route.js',
					'./src/kff.Router.js',
					'./src/kff.FrontController.js'
				],
				dest: './build/kff-all.js'
			}
		},
		min: {
			kff: {
				src: ['./build/kff-all.js'],
				dest: './build/kff-all.min.js'
			}
		},
		watch: {
	      	files: '<config:concat.kff.src>',
	      	tasks: 'concat min'
	    },
	    lint: {
			files: '<config:concat.kff.src>'
		},
		jshint: {
			options: {
				smarttabs: false
			}
		}
	});

	//grunt.loadNpmTasks('grunt-browserify');
	// Default task.
	grunt.registerTask('default', 'concat min');

};