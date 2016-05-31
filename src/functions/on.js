
var delegatedEventHandler = require('./delegatedEventHandler');

/**
 * Delegates DOM events on this element
 *
 * @param  {string} type      Event type (i.e. 'click')
 * @param  {string} selector  CSS selector
 * @param  {function} handler Event handler
 */
function on(handlers, element, type, selector, handler)
{
	var types = type.split(/\s+/);
	for(var i = 0, l = types.length; i < l; i++)
	{
		if(arguments.length === 5)
		{
			if(!handlers[selector])
			{
				handlers[selector] = delegatedEventHandler.bind(null, element, selector, handler);
			}
			element.addEventListener(types[i], handlers[selector], false);
		}
		else
		{
			// now selector = handler
			element.addEventListener(types[i], selector, false);
		}
	}
}

module.exports = on;