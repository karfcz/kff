(function(scope)
{
	var kff;

	if(typeof exports !== 'undefined') kff = exports;
	else kff = 'kff' in scope ? scope.kff : (scope.kff = {}) ;


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
			options = options || {};
			options.events = [
				['keydown drop change', 'inputChange']
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


})(this);