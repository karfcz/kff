
kff.useJQuery = true;

var matchesName;
if('webkitMatchesSelector' in document.documentElement) matchesName = 'webkitMatchesSelector';
else if('mozMatchesSelector' in document.documentElement) matchesName = 'mozMatchesSelector';
else if('oMatchesSelector' in document.documentElement) matchesName = 'oMatchesSelector';
else if('msMatchesSelector' in document.documentElement) matchesName = 'msMatchesSelector';

kff.Dom = kff.createClass(
{
	constructor: function(element)
	{
		this['0'] = element;
		this.handlers = {};
		this.$element = null;
	},

	// on: function()
	// {
	// 	if(!this.$element) this.$element = jQuery(this['0']);
	// 	return this.$element.on.apply(this.$element, arguments);
	// },

	// off: function()
	// {
	// 	if(!this.$element) this.$element = jQuery(this['0']);
	// 	return this.$element.off.apply(this.$element, arguments);
	// },

	on: function(type, selector, handler)
	{
		var types = type.split(/\s+/);
		for(var i = 0, l = types.length; i < l; i++)
		{
			if(arguments.length === 3)
			{
				if(!this.handlers[selector])
				{
					this.handlers[selector] = this.createHandler(this['0'], selector, handler);
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

	createHandler: function(el, selector, handler)
	{
		var that = this;
		return function(event)
		{
			var target = event.target;

			while(target !== el)
			{
				if(matchesName)
				{
					if(target[matchesName](selector))
					{
						handler.call(target, event, target);
						break;
					}
				}
				else
				{
					if(that.matches(el, target, selector))
					{
						handler.call(target, event, target);
						break;
					}
				}
				target = target.parentNode;
			}
		};
	},

	matches: function(el, target, selector)
	{
		var elements = el.querySelectorAll(selector);
		return kff.arrayIndexOf(elements, target) !== -1;
	}
});

var $ = function(element)
{
	if(kff.useJQuery && window.jQuery)
	{
		$ = window.jQuery;
	}
	else
	{
		$ = function(element)
		{
			if(element instanceof kff.Dom) var el = new kff.Dom(element[0]);
			else var el =  new kff.Dom(element);
			return el;
		};
	}
	return $(element);
};