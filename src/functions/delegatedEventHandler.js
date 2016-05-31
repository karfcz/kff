
var arrayIndexOf = require('./arrayIndexOf');

if(typeof document === 'object' && document !== null)
{
	var matchesMethodName;
	if('webkitMatchesSelector' in document.documentElement) matchesMethodName = 'webkitMatchesSelector';
	else if('mozMatchesSelector' in document.documentElement) matchesMethodName = 'mozMatchesSelector';
	else if('oMatchesSelector' in document.documentElement) matchesMethodName = 'oMatchesSelector';
	else if('msMatchesSelector' in document.documentElement) matchesMethodName = 'msMatchesSelector';
}

/**
 * Matches target element against CSS selector starting from element el
 *
 * @param  {DOMElement} el     Root DOM element
 * @param  {DOMElement} target Target DOM element
 * @param  {string} selector   CSS selector
 * @return {boolean}           True if target element matches CSS selector, false otherwise
 */
function matches(el, target, selector)
{
	var elements = el.querySelectorAll(selector);
	return arrayIndexOf(elements, target) !== -1;
}


/**
 * Intermediate event handler for delegating event to its appropriate handler(s)
 *
 * @param  {DOMElement} el    DOM element
 * @param  {string} selector  CSS selector
 * @param  {function} handler Event handler
 * @param  {DOMEvent} event   DOM event
 */
function delegatedEventHandler(el, selector, handler, event)
{
	var target = event.target;

	while(target && target !== el)
	{
		if(matchesMethodName)
		{
			if(target[matchesMethodName](selector))
			{
				event.matchedTarget = target;
				handler.call(target, event);
				break;
			}
		}
		else
		{
			if(matches(el, target, selector))
			{
				event.matchedTarget = target;
				handler.call(target, event);
				break;
			}
		}
		target = target.parentNode;
	}
}

module.exports = delegatedEventHandler;
