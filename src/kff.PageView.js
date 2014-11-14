
kff.PageView = kff.createClass(
{
	extend: kff.View,
	mixins: kff.EventsMixin,
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
	},

	/**
	 * Sets a new state of the view. Called by the front controller.
	 *
	 * @param {Object} state The state object (POJO)
	 */
	setState: function(state)
	{
		this.trigger('setState', state);
	},

	/**
	 * Initializes the view. Calls the render method. Should not be overloaded
	 * by subclasses.
	 *
	 * @private
	 * @param
	 */
	init: function()
	{
		this.renderAll();
		this.runAll();
	},

	/**
	 * Runs the view (i.e. binds events and models). It will be called automatically. Should not be called
	 * directly.
	 */
	runAll: function()
	{
		if(kff.View.prototype.runAll.call(this) !== false)
		{
			this.trigger('render');
		}
	},

	/**
	 * Destroys the view (destroys all subviews and unbinds previously bound DOM events.
	 * It will be called automatically. Should not be called directly.
	 *
	 * @param {Boolean} silent If true, the 'destroy' event won't be called
	 */
	destroyAll: function()
	{
		var ret = kff.View.prototype.destroyAll.call(this);

		if(ret !== false)
		{
			this.trigger('destroy');
		}
	}

});
