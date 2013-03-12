
kff.DoubleClickBinder = kff.createClass(
{
	extend: kff.Binder
},
/** @lends kff.DoubleClickBinder.prototype */
{
	/**
		@constructs
	*/
	constructor: function(options)
	{
		var eventNames = options.eventNames.length > 0 ? options.eventNames.join(' ') : 'dblclick';
		options = options || {};
		options.events = [
			[eventNames, 'dblclick']
		];
		kff.Binder.call(this, options);
	},

	init: function()
	{
		this.value = this.params[0] || null;
		kff.DoubleClickBinder._super.init.call(this);
	},

	dblclick: function(event)
	{
		setTimeout(this.f(function()
		{
			this.updateModel(this.value);
		}), 0);
	}
});

kff.BindingView.registerBinder('dblclick', kff.DoubleClickBinder);