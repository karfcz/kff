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
					'./kff.js',
					'./kff.Events.js',
					'./kff.LinkedList.js',
					'./kff.Collection.js',
					'./kff.Model.js',
					//'./kff.ArrayList.js',
					'./kff.ServiceContainer.js',
					'./kff.View.js',
					'./kff.PageView.js',
					'./kff.ViewFactory.js',
					'./kff.Route.js',
					'./kff.Router.js',
					'./kff.FrontController.js'
				],
				dest: 'kff-all.js'
			}
		},
		min: {
			kff: {
				src: ['kff-all.js'],
				dest: 'kff-all.min.js'
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