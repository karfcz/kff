
import Dom from './Dom';
import settings from './settings';

/**
 * Wrapper for DOM element.
 * This function returns either jQuery object that wraps DOM element or partially compatible DOM wrapper.
 * JQuery is used if useJquery === true (default setting is true) and jQuery exists in window object.
 *
 * @param  {DOMElement} element Single DOM element
 * @return {object}             JQuery object or Dom wrapper object
 */
var $;

if(settings.useJquery && typeof window === 'object' && window.jQuery)
{
	$ = window.jQuery;
}
else
{
	$ = function(element)
	{
		var el;
		if(element instanceof Dom) el = new Dom(element[0]);
		else el =  new Dom(element);
		return el;
	};
}

export default $;
