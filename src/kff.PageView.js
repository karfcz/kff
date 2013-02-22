
kff.PageView = kff.createClass(
{
	extend: kff.View,
	staticProperties:
	{
		precedingView: null
	}
},
/** @lends kff.PageView.prototype */
{
	/**
		Class for the full page view. PageViews behave as normal views but can be used by FrontController as
		targets for routing.

		@constructs
		@augments kff.View
		@param {Object} options Options object (see kff.View for details)
	*/
	constructor: function(options)
	{
		options = options || {};
		options.element = $('body');
		return kff.View.call(this, options);
	},

	/**
		@see kff.View#delegateEvents
	*/
	delegateEvents: function(events, $element)
	{
		kff.PageView._super.delegateEvents.call(this, events, $element || $(document));
	},

	/**
		@see kff.View#undelegateEvents
	*/
	undelegateEvents: function(events, $element)
	{
		kff.PageView._super.undelegateEvents.call(this, events, $element || $(document));
	},

	/**
		Sets a new state of the view. Called by the front controller.

		@param {Object} state The state object (POJO)
	*/
	setState: function(state, silent)
	{
		if(!silent) this.trigger('setState', state);
	}
});
