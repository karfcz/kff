
/**
 * Unbinds delegated DOM event handler from this element
 *
 * @param  {string} type      Event type (i.e. 'click')
 * @param  {string} selector  CSS selector
 * @param  {function} handler Previously bound event handler
 */
export default function off(handlers, element, type, selector)
{
	var types = type.split(/\s+/);
	for(var i = 0, l = types.length; i < l; i++)
	{
		if(typeof selector !== 'function')
		{
			if(handlers[selector])
			{
				element.removeEventListener(types[i], handlers[selector], false);
				handlers[selector] = undefined;
			}
		}
		else
		{
			element.removeEventListener(types[i], selector, false);
		}
	}
}
