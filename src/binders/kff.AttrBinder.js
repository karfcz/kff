
/** @class */
kff.AttrBinder = kff.createClass(
{
	extend: kff.Binder
},
/** @lends kff.AttrBinder.prototype */
{
	/**
	 * One-way data binder (model to DOM) for an element attribute.
	 * Sets the attribute of the element to defined value when model atrribute changes.
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
		this.attribute = this.params[0] || null;
		this.prefix = this.params[1] || null;
		kff.AttrBinder._super.init.call(this);
	},

	refresh: function()
	{
		if(this.attribute) this.$element.attr(this.attribute, this.prefix + this.getFormattedValue());
	}
});

kff.BindingView.registerBinder('attr', kff.AttrBinder);
