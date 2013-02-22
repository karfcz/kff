
/** @class */
kff.HtmlBinder = kff.createClass(
{
	extend: kff.Binder
},
/** @lends kff.HtmlBinder.prototype */
{
	refresh: function()
	{
		this.$element.html(this.values.join(' '));
	}
});

kff.BindingView.registerBinder('html', kff.HtmlBinder);
