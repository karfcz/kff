(function(scope)
{
	var kff;

	if(typeof exports !== 'undefined') kff = exports;
	else kff = 'kff' in scope ? scope.kff : (scope.kff = {}) ;

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
			options = options || {};
			options.events = [
				['click', 'inputChange']
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


})(this);