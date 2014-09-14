
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
		options.element = $(document.getElementsByTagName('body')[0]);
		this.cachedRegions = {};
		kff.View.call(this, options);
	},

	/**
	 * @see kff.View#delegateEvents
	 */
	delegateEvents: function(events, $element)
	{
		kff.PageView._super.delegateEvents.call(this, events, $element || $(document));
	},

	/**
	 * @see kff.View#undelegateEvents
	 */
	undelegateEvents: function(events, $element)
	{
		kff.PageView._super.undelegateEvents.call(this, events, $element || $(document));
	},

	/**
	 * Sets a new state of the view. Called by the front controller.
	 *
	 * @param {Object} state The state object (POJO)
	 */
	setState: function(state, silent)
	{
		if(!silent) this.trigger('setState', state);
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

	renderAll: function()
	{
		this.renderRegions(this.options.regions);

		kff.PageView._super.renderAll.call(this);
	},

	/**
	 * Runs the view (i.e. binds events and models). It will be called automatically. Should not be called
	 * directly.
	 */
	runAll: function(silent)
	{
		var ret = kff.View.prototype.runAll.call(this, silent);

		if(!((silent === true) || (ret === false)))
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
	destroyAll: function(silent)
	{
		var ret = kff.View.prototype.destroyAll.call(this, silent);

		this.clearRegions(this.options.regions);

		if(!((silent === true) || (ret === false)))
		{
			this.trigger('destroy');
		}
	},

	renderRegions: function(regions)
	{
		var selector, i, l, i2, l2, nodes, node, childNodes, fragment;
		if(kff.isPlainObject(regions))
		{
			for(selector in regions)
			{
				nodes = document.querySelectorAll(selector);
				for(i = 0, l = nodes.length; i < l; i++)
				{
					node = nodes[i];
					if(node.hasChildNodes())
					{
						if(!this.cachedRegions[selector]) this.cachedRegions[selector] = [];

						this.cachedRegions[selector][i] = fragment = document.createDocumentFragment();

						childNodes = new Array(node.childNodes.length);
						for(i2 = 0, l2 = childNodes.length; i2 < l2; i2++)
						{
							childNodes[i2] = node.childNodes[i2];
						}
						for(i2 = 0, l2 = childNodes.length; i2 < l2; i2++)
						{
							fragment.appendChild(childNodes[i2]);
						}
					}
					node.innerHTML = regions[selector];
				}
			}
		}
	},

	clearRegions: function(regions)
	{
		var selector, i, l, nodes, node, fragment;
		if(kff.isPlainObject(regions))
		{
			for(var selector in regions)
			{
				var nodes = document.querySelectorAll(selector);
				for(var i = nodes.length - 1; i >= 0; i--)
				{
					node = nodes[i];
					node.innerHTML = '';
					if(this.cachedRegions[selector])
					{
						fragment = this.cachedRegions[selector][i];
						if(fragment)
						{
							node.appendChild(fragment);
							this.cachedRegions[selector][i] = null;
						}
					}
				}
			}
		}
	}

});
