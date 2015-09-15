
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


			// if(this.options.params[0])
			// {
			// 	if(this.options.parsers.length === 0) this.equalsTo = convertValueType(this.options.params[0]);
			// 	else this.equalsTo = this.parse(this.options.params[0]);
			// }
			// else this.options.params[0] = this.equalsTo;

			this.negate = this.options.params[1] === 'ne' || negate;

			this.forceRerender = force || this.options.params[2] === 'force' || this.options.params[1] === 'force';

			this.isInserted = true;

			if(this.forceRerender)
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
		},

		destroy: function()
		{
			if(this.forceRerender)
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
					parentNode.replaceChild(this.$element[0], this.anchor);
				}
				this.isInserted = true;
			}
			this.anchor = null;

			Binder.prototype.destroy.call(this);
		},

		refresh: function()
		{
			var parentNode;
			if(!this.anchor)
			{
				this.anchor = this.view.env.document.createTextNode('');
				this.$element[0].parentNode.insertBefore(this.anchor, this.$element[0]);
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
						nodeInsert(parentNode, this.anchor, this.$element[0]);
						// parentNode.replaceChild(this.$element[0], this.anchor);
					}
					this.isInserted = true;
				}
				if(this.forceRerender)
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
					parentNode = this.$element[0].parentNode;

					if(parentNode)
					{
						nodeRemove(parentNode, this.$element[0], this.f(function()
						{
							if(this.forceRerender && this.isRendered)
							{
								this.destroySubviews.call(this.view);
								this.isRendered = false;
								this.isRun = false;
							}
							this.isInserted = false;
						}));
						this.isInserted = false;

						// parentNode.removeChild(this.$element[0]);
						// parentNode.replaceChild(this.anchor, this.$element[0]);
					}
				}
				else if(this.forceRerender && this.isRendered)
				{
					this.destroySubviews.call(this.view);
					this.isRendered = false;
					this.isRun = false;
				}
			}
		},

		matchValue: function()
		{
			if(this.options.params.length > 0)
			{
				if(this.valueCursor)
				{
					this.equalsTo = this.valueCursor.get();
					if(this.equalsTo == null) this.equalsTo = null;
				}
				var value = this.value;
				if(value == null) value = null;
				if(this.negate) return value !== this.equalsTo;
				else return value === this.equalsTo;
			}
			else return this.value;
		}
	});

};

// InsertBinder = createInsertBinder(false, false);
var IfBinder = createInsertBinder(false, true);
var IfNotBinder = createInsertBinder(true, true);

// BindingView.registerBinder('insert', InsertBinder);
View.registerBinder('if', IfBinder);
View.registerBinder('ifnot', IfNotBinder);

module.exports = {
	IfBinder: IfBinder,
	IfNotBinder: IfNotBinder
};

