(function(scope)
{
	var kff;

	if(typeof exports !== 'undefined') kff = exports;
	else kff = 'kff' in scope ? scope.kff : (scope.kff = {}) ;


	kff.ClickBinder = kff.createClass(
	{
		extend: kff.Binder
	},
	/** @lends kff.ClickBinder.prototype */
	{
		/**
			@constructs
		*/
		constructor: function(options)
		{
			options = options || {};
			options.events = [
				['click', 'click']
			];
			kff.Binder.call(this, options);
		},

		init: function()
		{
			this.value = this.params[0] || null;
			kff.ClickBinder._super.init.call(this);
		},

		click: function(event)
		{
			setTimeout(this.f(function()
			{
				this.updateModel(this.value);
			}), 0);
		}
	});

	kff.BindingView.registerBinder('click', kff.ClickBinder);


})(this);