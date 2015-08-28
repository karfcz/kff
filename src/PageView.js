
var createClass = require('./functions/createClass');
var $ = require('./dollar');

var View = require('./View');

var PageView = createClass(
{
	extend: View,
	args: [{
		serviceContainer: '@'
	}]
},
/** @lends PageView.prototype */
{
	/**
	 * Class for the full page view. PageViews behave as normal views but can be used by FrontController as
	 * targets for routing.
	 *
	 * @constructs
	 * @augments View
	 * @param {Object} options Options object (see View for details)
	 */
	constructor: function(options)
	{
		options = options || {};
		this.$docElement = options.element ? $(options.element) : $(options.env.document);
		options.element = options.element || options.env.document.body;

		View.call(this, options);
	},

	/**
	 * @see View#delegateEvents
	 */
	delegateEvents: function(events, $element)
	{
		if(!$element) $element = this.$docElement;
		PageView._super.delegateEvents.call(this, events, $element);
	},

	/**
	 * @see View#undelegateEvents
	 */
	undelegateEvents: function(events, $element)
	{
		if(!$element) $element = this.$docElement;
		PageView._super.undelegateEvents.call(this, events, $element);
	}

});

module.exports = PageView;
