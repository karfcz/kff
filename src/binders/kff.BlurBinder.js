
/** @class */
kff.BlurBinder = kff.createClass(
{
	extend: kff.Binder
},
/** @lends kff.BlurBinder.prototype */
{
	/**
		@constructs
	*/
	constructor: function(options)
	{
		options = options || {};
		options.events = [
			['blur', 'blur']
		];
		kff.Binder.call(this, options);
	},

	init: function()
	{
		this.value = this.params[0] || null;
		kff.BlurBinder._super.init.call(this);
	},

	blur: function(event)
	{
		setTimeout(this.f(function()
		{
			this.updateModel(this.value);
		}), 0);
	}
});

kff.BindingView.registerBinder('blur', kff.BlurBinder);