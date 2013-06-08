
kff.TemplateBinder = kff.createClass(
{
	extend: kff.Binder
},
/** @lends kff.TemplateBinder.prototype */
{
	/**
	 * One-way data binder for html content of the element.
	 * Renders html content of the element on change of the bound model attribute.
	 * Inserted content will be processed for eventual subviews and bindings
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
		this.view.destroySubviews();
		this.$element.html(this.values.join(' '));
		this.view.renderSubviews();

	}
});

kff.BindingView.registerBinder('template', kff.TemplateBinder);
