
kff.PageView = kff.createClass(
{
	extend: kff.View,
	statics:
	{
		precedingView: null,
		args: [{
			viewFactory: '@kff.ViewFactory'
		}]
	}
},
/** @lends kff.PageView.prototype */
{
	/**
	 * Class for the full page view. PageViews behave as normal views but can be used by FrontController as
	 * targets for routing.
	 *
	 * @constructs
	 * @augments kff.View
	 * @param {Object} options Options object (see kff.View for details)
	 */
	constructor: function(options)
	{
		options = options || {};
		this.$docElement = options.element ? $(options.element) : $(options.env.document);
		options.element = options.element || options.env.document.body;

		kff.View.call(this, options);
	},

	/**
	 * @see kff.View#delegateEvents
	 */
	delegateEvents: function(events, $element)
	{
		if(!$element) $element = this.$docElement;
		kff.PageView._super.delegateEvents.call(this, events, $element);
	},

	/**
	 * @see kff.View#undelegateEvents
	 */
	undelegateEvents: function(events, $element)
	{
		if(!$element) $element = this.$docElement;
		kff.PageView._super.undelegateEvents.call(this, events, $element);
	}

});
