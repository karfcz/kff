
kff.HtmlBinder = kff.createClass(
{
	extend: kff.Binder
},
/** @lends kff.HtmlBinder.prototype */
{
	/**
	 * One-way data binder for html content of the element.
	 * Renders html content of the element on change of the bound model attribute.
	 *
	 * @constructs
	 * @augments kff.Binder
	 * @param {Object} options Options object
	 */
	constructor: function(options)
	{
		kff.Binder.call(this, options);
	},

	refresh: function()
	{
		var val = this.value;
		if(val === null || val === undefined) val = '';
		this.$element[0].innerHTML = val;
	}
});

kff.BindingView.registerBinder('html', kff.HtmlBinder);
