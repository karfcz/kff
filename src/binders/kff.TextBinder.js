
/** @class */
kff.TextBinder = kff.createClass(
{
	extend: kff.Binder
},
/** @lends kff.TextBinder.prototype */
{
	/**
		@constructs
	*/
	constructor: function(options)
	{
		options = options || {};
		kff.Binder.call(this, options);
	},

	init: function()
	{
		kff.TextBinder._super.init.call(this);
	},

	refresh: function(value)
	{
		this.$element.text(this.values.join(' '));
	}
});

kff.BindingView.registerBinder('text', kff.TextBinder);
