var mixins = require('./mixins');

function viewClassFactory(ctor, defaultOptions)
{
	return function(options)
	{
		return new ctor(mixins({}, defaultOptions || {}, options || {}));
	}
}

module.exports = viewClassFactory;
// module.exports = classWithOptions;