
var createClass = require('../functions/createClass');
var convertValueType = require('../functions/convertValueType');
var noop = require('../functions/noop');
var Binder = require('../Binder');
var View = require('../View');

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
		},

		init: function()
		{
			this.equalsTo = true;

			if(this.options.params[0])
			{
				if(this.options.parsers.length === 0) this.equalsTo = convertValueType(this.options.params[0]);
				else this.equalsTo = this.parse(this.options.params[0]);
			}
			else this.options.params[0] = this.equalsTo;

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
				parentNode = this.anchor.parentNode;

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
			if(!this.anchor) this.anchor = this.view.env.document.createTextNode('');
			if(this.matchValue())
			{
				if(!this.isInserted)
				{
					parentNode = this.anchor.parentNode;

					if(parentNode)
					{
						parentNode.replaceChild(this.$element[0], this.anchor);
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
						parentNode.replaceChild(this.anchor, this.$element[0]);
					}
					this.isInserted = false;
				}
				if(this.forceRerender && this.isRendered)
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
				if(this.negate) return this.value !== this.equalsTo;
				else return this.value === this.equalsTo;
			}
			else return this.value;
		}
	});

};

// InsertBinder = createInsertBinder(false, false);
IfBinder = createInsertBinder(false, true);
IfNotBinder = createInsertBinder(true, true);

// BindingView.registerBinder('insert', InsertBinder);
View.registerBinder('if', IfBinder);
View.registerBinder('ifnot', IfNotBinder);

module.exports = {
	IfBinder: IfBinder,
	IfNotBinder: IfNotBinder
};
