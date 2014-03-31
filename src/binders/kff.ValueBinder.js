
kff.ValueBinder = kff.createClass(
{
	extend: kff.Binder
},
/** @lends kff.ValueBinder.prototype */
{
	/**
	 * Two-way data binder for input, select, textarea elements.
	 * Triggers model change on keydown, drop and change events on default.
	 *
	 * @constructs
	 * @augments kff.Binder
	 * @param {Object} options Options object
	 */
	constructor: function(options)
	{
		var eventNames = options.eventNames.length > 0 ? options.eventNames.join(' ') : 'keydown drop change';
		options.events = [
			[eventNames, 'inputChange']
		];
		kff.Binder.call(this, options);
	},

	inputChange: function(event)
	{
		kff.setZeroTimeout(this.f(function()
		{
			this.updateModel(this.$element.val());
		}));
	},

	refresh: function()
	{
		var val = this.getFormattedValue();
		if(val === null || val === undefined) val = '';

		if(this.$element[0].nodeName === 'SELECT')
		{
			kff.setZeroTimeout(this.f(function()
			{
				this.$element.val(val);
			}));
		}
		else
		{
			this.$element[0].value = val;
		}
	},

	fill: function()
	{
		if(!this.fillVal) this.fillVal = this.$element.val();
		this.updateModel(this.fillVal);
	}
});

kff.BindingView.registerBinder('val', kff.ValueBinder);
