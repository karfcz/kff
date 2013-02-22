/*
 *  Parts of kff.Route code from https://github.com/visionmedia/page.js
 *  Copyright (c) 2012 TJ Holowaychuk <tj@vision-media.ca>
 */

kff.Route = kff.createClass(
/** @lends kff.Route.prototype */
{
	/**
		@constructs
	*/
	constructor: function(pattern, target)
	{
		this.pattern = pattern;
		this.target = target;
		this.keys = null;
		this.regexp = this.compileRegex();
	},

	getTarget: function()
	{
		return this.target;
	},

	match: function(path, params)
	{
		var keys = this.keys,
			qsIndex = path.indexOf('?'),
			pathname = ~qsIndex ? path.slice(0, qsIndex) : path,
			m = this.regexp.exec(pathname);

		if (!m) return false;

		for (var i = 1, len = m.length; i < len; ++i) {
			var key = keys[i - 1];

			var val = 'string' == typeof m[i]
				? decodeURIComponent(m[i])
				: m[i];

			if (key) {
				params[key.name] = undefined !== params[key.name]
					? params[key.name]
					: val;
			} else {
				params.push(val);
			}
		}

		return true;
	},

	/**
	 * Normalize the given path string,
	 * returning a regular expression.
	 *
	 * An empty array should be passed,
	 * which will contain the placeholder
	 * key names. For example "/user/:id" will
	 * then contain ["id"].
	 *
	 * @param  {String|RegExp|Array} path
	 * @param  {Array} keys
	 * @param  {Boolean} sensitive
	 * @param  {Boolean} strict
	 * @return {RegExp}
	 * @api private
	 */
	compileRegex: function(sensitive, strict)
	{
		var keys = this.keys = [];
		var path;

		path = this.pattern
			.concat(strict ? '' : '/?')
			.replace(/\/\(/g, '(?:/')
			.replace(/(\/)?(\.)?:(\w+)(?:(\(.*?\)))?(\?)?/g, function(_, slash, format, key, capture, optional){
				keys.push({ name: key, optional: !! optional });
				slash = slash || '';
				return ''
					+ (optional ? '' : slash)
					+ '(?:'
					+ (optional ? slash : '')
					+ (format || '') + (capture || (format && '([^/.]+?)' || '([^/]+?)')) + ')'
					+ (optional || '');
			})
			.replace(/([\/.])/g, '\\$1')
			.replace(/\*/g, '(.*)');
		return new RegExp('^' + path + '$', sensitive ? '' : 'i');
	}


});
