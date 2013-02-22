
/** @class */
kff.AttrBinder = kff.createClass(
{
	extend: kff.Binder
},
/** @lends kff.AttrBinder.prototype */
{
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
