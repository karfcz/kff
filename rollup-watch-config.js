var babel = require('rollup-plugin-babel');
var uglify = require('rollup-plugin-uglify');
var replace = require('rollup-plugin-replace');

export default {
	entry: './src/entry-es.js',
	format: 'es',
	moduleName: 'kff',
	moduleId: 'kff',
	plugins: [
		babel({
			exclude: './node_modules/**'
		})
	]
};
