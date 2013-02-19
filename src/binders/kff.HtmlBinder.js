(function(scope)
{
	var kff;

	if(typeof exports !== 'undefined') kff = exports;
	else kff = 'kff' in scope ? scope.kff : (scope.kff = {}) ;


	/** @class */
	kff.HtmlBinder = kff.createClass(
	{
		extend: kff.Binder
	},
	/** @lends kff.HtmlBinder.prototype */
	{
		refresh: function()
		{
			this.$element.html(this.values.join(' '));
		}
	});

	kff.BindingView.registerBinder('html', kff.HtmlBinder);

})(this);