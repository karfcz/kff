var mixins = require('./mixins');

function viewClassFactory(ctor, defaultOptions)
{
	return function(options)
	{
		return new ctor(mixins({}, (typeof defaultOptions === 'function' ? defaultOptions() : defaultOptions) || {}, options || {}));
	}
}

module.exports = viewClassFactory;
