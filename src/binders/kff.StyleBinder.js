
kff.StyleBinder = kff.createClass(
{
	extend: kff.Binder
},
/** @lends kff.StyleBinder.prototype */
{
	/**
	 * One-way data binder (model to DOM) for any CSS style property.
	 * Sets the CSS property of the element to defined value when model atrribute changes.
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
		this.styleProperty = this.options.params[0] || null;
		this.styleUnit = this.options.params[1] || '';
		kff.StyleBinder._super.init.call(this);
	},

	refresh: function()
	{
		var value = this.value;

		if(this.styleProperty)
		{
			if(value === undefined) delete this.$element[0].style[this.styleProperty];
			else
			{
				if(this.styleUnit) value += this.styleUnit;
				this.$element[0].style[this.styleProperty] = value;
			}
		}
	}
});

kff.BindingView.registerBinder('style', kff.StyleBinder);
