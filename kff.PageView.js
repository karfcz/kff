
(function(scope)
{
	var kff;

	if(typeof exports !== 'undefined') kff = exports;
	else kff = 'kff' in scope ? scope.kff : (scope.kff = {}) ;

	/**
	 * kff.PageView
	 */
	kff.PageView = kff.createClass(
	{
		extend: kff.View,
		staticProperties:
		{
			precedingView: null
		}
	},
	{
		constructor: function(options)
		{
			options = options || {};
			options.element = $('body');
			return kff.View.call(this, options);
		},

		delegateEvents: function(events, $element)
		{
			kff.PageView._super.delegateEvents.call(this, events, $element || $(document));
		},

		undelegateEvents: function(events, $element)
		{
			kff.PageView._super.undelegateEvents.call(this, events, $element || $(document));
		},

		setState: function(state, silent)
		{
			if(!silent) this.trigger('setState', state);
		}
	});

})(this);
