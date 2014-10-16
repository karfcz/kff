
kff.ClassBinder = kff.createClass(
{
	extend: kff.Binder
},
/** @lends kff.ClassBinder.prototype */
{
	/**
	 * One-way data binder (model to DOM) for CSS class.
	 * Sets/Unsets the class of the element to some predefined value when model atrribute changes.
	 *
	 * @constructs
	 * @augments kff.Binder
	 * @param {Object} options Options objectt
	 */
	constructor: function(options)
	{
		kff.Binder.call(this, options);
	},

	init: function()
	{
		this.className = this.options.params[0] || null;
		this.equalsTo = this.options.params[1] || true;
		this.operator = this.options.params[2] || null;
		kff.ClassBinder._super.init.call(this);
	},

	refresh: function()
	{
		if(this.className)
		{
			if(this.matchValue())
			{
				this.$element[0].classList.add(this.className);
			}
			else
			{
				this.$element[0].classList.remove(this.className);
			}
		}
	},

	matchValue: function()
	{
		var parsedValue;
		if(this.equalsTo)
		{
			if(this.options.parsers.length === 0) parsedValue = this.convertValueType(this.equalsTo);
			else parsedValue = this.parse(this.equalsTo);

			var value = this.value;
			if(parsedValue == null) parsedValue = null;
			if(value == null) value = null;
			if(this.operator === 'ne') return value !== parsedValue;
			else return value === parsedValue;
		}
		else return this.value;
	}
});

if(typeof document === 'object' && document !== null)
{
	if(!('classList' in document.documentElement))
	{
		kff.ClassBinder.prototype.refresh = function(value)
		{
			if(this.className)
			{
				this.$element[this.matchValue() ? 'addClass' : 'removeClass'](this.className);
			}
		};
	}
}

kff.BindingView.registerBinder('class', kff.ClassBinder);
