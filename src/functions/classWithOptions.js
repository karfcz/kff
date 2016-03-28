var mixins = require('./mixins');

function classWithOptions(ctor, defaultOptions)
{
	return function(options)
	{
		return new ctor(mixins({}, defaultOptions || {}, options || {}));
	}
}

module.exports = classWithOptions;