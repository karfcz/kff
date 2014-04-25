
kff.useJquery = true;

var matchesMethodName;
if('webkitMatchesSelector' in document.documentElement) matchesMethodName = 'webkitMatchesSelector';
else if('mozMatchesSelector' in document.documentElement) matchesMethodName = 'mozMatchesSelector';
else if('oMatchesSelector' in document.documentElement) matchesMethodName = 'oMatchesSelector';
else if('msMatchesSelector' in document.documentElement) matchesMethodName = 'msMatchesSelector';

kff.Dom = kff.createClass(
{
	constructor: function(element)
	{
		this['0'] = element;
		this.handlers = {};
		this.$element = null;
	},

	on: function(type, selector, handler)
	{
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

	off: function(type, selector, handler)
	{
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

	matches: function(el, target, selector)
	{
		var elements = el.querySelectorAll(selector);
		return kff.arrayIndexOf(elements, target) !== -1;
	},

	html: function(html)
	{
		this['0'].innerHTML = html;
	},

	remove: function()
	{
		if(this['0'].parentNode)
		{
			this['0'].parentNode.removeChild(this['0']);
			this['0'] = null;
		}
	}
});

kff.$ = function(element)
{
	if(kff.useJquery && window.jQuery)
	{
		kff.$ = window.jQuery;
	}
	else
	{
		kff.$ = function(element)
		{
			if(element instanceof kff.Dom) var el = new kff.Dom(element[0]);
			else var el =  new kff.Dom(element);
			return el;
		};
	}
	return kff.$(element);
};

var $ = kff.$;