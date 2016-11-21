import mixins from './mixins.js';

export default function viewClassFactory(ctor, defaultOptions)
{
	return function(options)
	{
		return new ctor(mixins({}, (typeof defaultOptions === 'function' ? defaultOptions() : defaultOptions) || {}, options || {}));
	}
}
