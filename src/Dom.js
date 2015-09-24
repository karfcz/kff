
var createClass = require('./functions/createClass');
var arrayIndexOf = require('./functions/arrayIndexOf');

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

	while(target !== el)
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
			element.addEventListener(types[i], selector, false);
		}
	}
}

/**
 * Unbinds delegated DOM event handler from this element
 *
 * @param  {string} type      Event type (i.e. 'click')
 * @param  {string} selector  CSS selector
 * @param  {function} handler Previously bound event handler
 */
function off(handlers, element, type, selector)
{
	var types = type.split(/\s+/);
	for(var i = 0, l = types.length; i < l; i++)
	{
		if(arguments.length === 5)
		{
			if(handlers[selector])
			{
				element.removeEventListener(types[i], handlers[selector], false);
			}
		}
		else
		{
			element.removeEventListener(types[i], selector, false);
		}
	}
}

var Dom = createClass(
/** @lends Dom.prototype	*/
{
	/**
	 * @constructs
	 * @param  {DOMElement} element DOM element
	 */
	constructor: function(element)
	{
		this['0'] = element;
		this.handlers = null;
	},

	/**
	 * Delegates DOM events on this element
	 *
	 * @param  {string} type      Event type (i.e. 'click')
	 * @param  {string} selector  CSS selector
	 * @param  {function} handler Event handler
	 */
	on: function(type, selector, handler)
	{
		if(!this.handlers) this.handlers = {};
		on(this.handlers, this['0'], type, selector, handler);
	},

	/**
	 * Unbinds delegated DOM event handler from this element
	 *
	 * @param  {string} type      Event type (i.e. 'click')
	 * @param  {string} selector  CSS selector
	 * @param  {function} handler Previously bound event handler
	 */
	off: function(type, selector)
	{
		if(!this.handlers) this.handlers = {};
		off(this.handlers, this['0'], type, selector);
	},

	/**
	 * Sets innerHTML of element
	 *
	 * @param  {string} html HTML string to be set
	 */
	html: function(html)
	{
		this['0'].innerHTML = html;
	},

	/**
	 * Removes element from the DOM
	 */
	remove: function()
	{
		if(this['0'].parentNode)
		{
			this['0'].parentNode.removeChild(this['0']);
			this['0'] = null;
		}
	}
});

module.exports = {
	on: on,
	off: off,
	Dom: Dom,
};