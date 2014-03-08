
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
		this.styleProperty = this.params[0] || null;
		this.styleUnit = this.params[1] || '';
		kff.StyleBinder._super.init.call(this);
	},

	refresh: function()
	{
		var value = this.value;
		if(this.styleUnit) value += this.styleUnit;
		if(this.styleProperty) this.$element.css(this.styleProperty, this.value + this.styleUnit);
	}
});

kff.BindingView.registerBinder('style', kff.StyleBinder);
