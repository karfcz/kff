module.exports = function(grunt) {

	// Project configuration.
	grunt.initConfig({
		concat: {
			kff: {
				src: [
					'./kff.js',
					'./kff.Events.js',
					'./kff.Model.js',
					'./kff.View.js'
				//	'./kff.FrontController.js'
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

	// Default task.
	grunt.registerTask('default', 'concat min');

};