
kff.CheckBinder = kff.createClass(
{
	extend: kff.Binder
},
/** @lends kff.CheckBinder.prototype */
{
	/**
		@constructs
	*/
	constructor: function(options)
	{
		options = options || {};
		options.events = [
			['click change', 'inputChange']
		];
		kff.Binder.call(this, options);
	},

	inputChange: function(event)
	{
		setTimeout(this.f(function()
		{
			this.updateModel(this.$element.is(':checked'));
		}), 0);
	},

	refresh: function()
	{
		this.$element.prop('checked', !!this.values[this.valueIndex]);
	}
});

kff.BindingView.registerBinder('check', kff.CheckBinder);
