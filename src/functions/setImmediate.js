
/**
 * Calls a function in the next process cycle with minimal timeout. It is like
 * setTimeout(fn, 0) but with better performance (does not obey the internal
 * browser limits for timeout that exist due to backward compatibility).
 *
 * Fallbacks to setTimeout on older MSIE.
 *
 * @param  {function}  fn Callback function
 */

var setImmediate = null;

var callbacks = [], messageName = 'kff-setimmediate-msg';

var handleMessage = function(event)
{
	if(event.source === window && event.data === messageName)
	{
		event.stopPropagation();
		if(callbacks.length > 0) callbacks.shift()();
	}
};

if(typeof window === 'object' && 'postMessage' in window && 'addEventListener' in window && !('attachEvent' in window))
{
	setImmediate = function(fn)
	{
		callbacks.push(fn);
		window.postMessage(messageName, '*');
	};
	window.addEventListener('message', handleMessage, true);
}
else
{
	setImmediate = function(fn)
	{
		setTimeout(fn, 0);
	};
}

export default setImmediate;
