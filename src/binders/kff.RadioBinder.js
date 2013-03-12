
kff.RadioBinder = kff.createClass(
{
	extend: kff.Binder
},
/** @lends kff.RadioBinder.prototype */
{
	/**
		@constructs
	*/
	constructor: function(options)
	{
		var eventNames = options.eventNames.length > 0 ? options.eventNames.join(' ') : 'click';
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
			if(this.$element.is(':checked'))
			{
				this.updateModel(this.$element.val());
			}
		}), 0);
	},

	refresh: function()
	{
		this.$element.prop('checked', this.parse(this.$element.val()) === this.currentValue);
	}
});

kff.BindingView.registerBinder('radio', kff.RadioBinder);
