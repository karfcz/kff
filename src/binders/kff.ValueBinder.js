
kff.ValueBinder = kff.createClass(
{
	extend: kff.Binder
},
/** @lends kff.ValueBinder.prototype */
{
	/**
		@constructs
	*/
	constructor: function(options)
	{
		var eventNames = options.eventNames ? options.eventNames.join(' ') : 'keydown drop change';
		options = options || {};
		options.events = [
			[eventNames, 'inputChange']
		];
		kff.Binder.call(this, options);
	},

	inputChange: function(event)
	{
		setTimeout(this.f(function()
		{
			this.updateModel(this.$element.val());
		}), 0);
	},

	refresh: function()
	{
		this.$element.val(this.getFormattedValue());
	}
});

kff.BindingView.registerBinder('val', kff.ValueBinder);
