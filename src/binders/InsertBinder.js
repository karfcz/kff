
var createClass = require('../functions/createClass');
var convertValueType = require('../functions/convertValueType');
var noop = require('../functions/noop');
var Binder = require('../Binder');
var View = require('../View');
var insertBefore = require('../functions/nodeMan').insertBefore;
var removeChild = require('../functions/nodeMan').removeChild;
var Cursor = require('../Cursor');

var createInsertBinder = function(negate, force){

	return createClass(
	{
		extend: Binder
	},
	/** @lends InsertBinder.prototype */
	{
		/**
		 * One-way data binder (model to DOM) for inserting/removing element from DOM.
		 *
		 * @constructs
		 * @augments Binder
		 * @param {Object} options Options objectt
		 */
		constructor: function(options)
		{
			Binder.call(this, options);
			this.equalsTo = undefined;
			this.valueCursor = undefined;
			this.isInitialized = false;
			this.isRendered = false;
		},

		init: function()
		{
			this.equalsTo = true;
			this.valueCursor = undefined;

			if(this.options.params[0])
			{
				this.equalsTo = this.convertBindingValue(this.options.params[0]);
				if(this.equalsTo instanceof Cursor)
				{
					this.valueCursor = this.equalsTo;
					this.equalsTo = this.valueCursor.get();
				}
				if(this.equalsTo == null) this.equalsTo = null;
			}

			this.isInserted = true;

			if(force)
			{
				this.isRun = false;
				this.isRendered = true;

				this.renderSubviews = this.view.renderSubviews;
				this.runSubviews = this.view.runSubviews;
				this.destroySubviews = this.view.destroySubviews;

				this.view.renderSubviews = noop;
				this.view.runSubviews = noop;
				this.view.destroySubviews = noop;
			}

			Binder.prototype.init.call(this);

			this.isInitialized = true;
		},

		destroy: function()
		{
			if(!this.isInitialized) return;
			if(force)
			{
				this.view.renderSubviews = this.renderSubviews;
				this.view.runSubviews = this.runSubviews;
				this.view.destroySubviews = this.destroySubviews;
			}
			if(!this.isInserted && this.anchor)
			{
				var parentNode = this.anchor.parentNode;

				if(parentNode)
				{
					parentNode.replaceChild(this.element, this.anchor);
				}
				this.isInserted = true;
			}
			this.anchor = null;
			this.isInitialized = false;
			this.isRendered = false;

			Binder.prototype.destroy.call(this);
		},

		refresh: function()
		{
			if(!this.isInitialized) return;
			var parentNode;
			if(!this.anchor)
			{
				this.anchor = this.view.env.document.createTextNode('');
				this.element.parentNode.insertBefore(this.anchor, this.element);
			}

			var nodeInsert = insertBefore;
			var nodeRemove = removeChild;

			if(this.animate)
			{
				nodeInsert = this.view.scope[this.animate]['insert'];
				nodeRemove = this.view.scope[this.animate]['remove'];
			}

			if(this.matchValue())
			{
				if(!this.isInserted)
				{
					parentNode = this.anchor.parentNode;

					if(parentNode)
					{
						nodeInsert(parentNode, this.anchor, this.element);
					}
					this.isInserted = true;
				}
				if(force)
				{
					if(!this.isRendered)
					{
						this.renderSubviews.call(this.view);
						this.isRendered = true;
					}
					if(!this.isRun)
					{
						this.runSubviews.call(this.view);
						this.isRun = true;
					}
				}
			}
			else
			{
				if(this.isInserted)
				{
					parentNode = this.element.parentNode;

					if(parentNode)
					{
						nodeRemove(parentNode, this.element, this.f(function()
						{
							if(force && this.isRendered)
							{
								this.destroySubviews.call(this.view);
								this.isRendered = false;
								this.isRun = false;
							}
							this.isInserted = false;
						}));
						this.isInserted = false;
					}
				}
				else if(force && this.isRendered)
				{
					this.destroySubviews.call(this.view);
					this.isRendered = false;
					this.isRun = false;
				}
			}
		},

		matchValue: function()
		{
			var value = this.value;
			if(value == null) value = null;
			if(this.options.params.length > 0)
			{
				if(this.valueCursor)
				{
					this.equalsTo = this.valueCursor.get();
					if(this.equalsTo == null) this.equalsTo = null;
				}
			}
			if(negate) return value !== this.equalsTo;
			else return value === this.equalsTo;
		}
	});

};

var IfBinder = createInsertBinder(false, true);
var IfNotBinder = createInsertBinder(true, true);

View.registerBinder('if', IfBinder);
View.registerBinder('ifnot', IfNotBinder);

module.exports = {
	IfBinder: IfBinder,
	IfNotBinder: IfNotBinder
};
