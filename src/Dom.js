
import createClass from './functions/createClass';
import arrayIndexOf from './functions/arrayIndexOf';

if(typeof document === 'object' && document !== null)
{
	var matchesMethodName;
	if('webkitMatchesSelector' in document.documentElement) matchesMethodName = 'webkitMatchesSelector';
	else if('mozMatchesSelector' in document.documentElement) matchesMethodName = 'mozMatchesSelector';
	else if('oMatchesSelector' in document.documentElement) matchesMethodName = 'oMatchesSelector';
	else if('msMatchesSelector' in document.documentElement) matchesMethodName = 'msMatchesSelector';
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
		var types = type.split(/\s+/);
		for(var i = 0, l = types.length; i < l; i++)
		{
			if(arguments.length === 3)
			{
				if(!this.handlers[selector])
				{
					this.handlers[selector] = this.f(this.delegatedEventHandler, [this['0'], selector, handler]);
				}
				this['0'].addEventListener(types[i], this.handlers[selector], false);
			}
			else
			{
				this['0'].addEventListener(types[i], selector, false);
			}
		}
	},

	/**
	 * Unbinds delegated DOM event handler from this element
	 *
	 * @param  {string} type      Event type (i.e. 'click')
	 * @param  {string} selector  CSS selector
	 * @param  {function} handler Previously bound event handler
	 */
	off: function(type, selector, handler)
	{
		if(!this.handlers) this.handlers = {};
		var types = type.split(/\s+/);
		for(var i = 0, l = types.length; i < l; i++)
		{
			if(arguments.length === 3)
			{
				if(this.handlers[selector])
				{
					this['0'].removeEventListener(types[i], this.handlers[selector], false);
				}
			}
			else
			{
				this['0'].removeEventListener(types[i], selector, false);
			}
		}
	},

	/**
	 * Intermediate event handler for delegating event to its appropriate handler(s)
	 *
	 * @param  {DOMElement} el    DOM element
	 * @param  {string} selector  CSS selector
	 * @param  {function} handler Event handler
	 * @param  {DOMEvent} event   DOM event
	 */
	delegatedEventHandler: function(el, selector, handler, event)
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
				if(this.matches(el, target, selector))
				{
					event.matchedTarget = target;
					handler.call(target, event);
					break;
				}
			}
			target = target.parentNode;
		}
	},

	/**
	 * Matches target element against CSS selector starting from element el
	 *
	 * @param  {DOMElement} el     Root DOM element
	 * @param  {DOMElement} target Target DOM element
	 * @param  {string} selector   CSS selector
	 * @return {boolean}           True if target element matches CSS selector, false otherwise
	 */
	matches: function(el, target, selector)
	{
		var elements = el.querySelectorAll(selector);
		return arrayIndexOf(elements, target) !== -1;
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

export default Dom;