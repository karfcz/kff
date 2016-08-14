
var createClass = require('../functions/createClass');
var convertValueType = require('../functions/convertValueType');
var Binder = require('../Binder');
var View = require('../View');
var Cursor = require('../Cursor');

var createClassBinder = function(negate)
{
	var ClassBinder = createClass(
	{
		extend: Binder
	},
	/** @lends ClassBinder.prototype */
	{
		/**
		 * One-way data binder (model to DOM) for CSS class.
		 * Sets/Unsets the class of the element to some predefined value when model atrribute changes.
		 *
		 * @constructs
		 * @augments Binder
		 * @param {Object} options Options objectt
		 */
		constructor: function(options)
		{
			Binder.call(this, options);

			this.className = undefined;
			this.equalsTo = undefined;
			this.valueCursor = undefined;
		},

		init: function()
		{
			this.className = this.convertBindingValue(this.options.params[0]) || null;
			this.equalsTo = true;
			this.valueCursor = undefined;

			if(this.options.params[1])
			{
				this.equalsTo = this.convertBindingValue(this.options.params[1]);
				if(this.equalsTo instanceof Cursor)
				{
					this.valueCursor = this.equalsTo;
					this.equalsTo = this.valueCursor.get();
				}
				if(this.equalsTo == null) this.equalsTo = null;
			}

			this.negate = this.options.params[2] === 'ne' || negate;

			ClassBinder._super.init.call(this);
		},

		refresh: function()
		{
			if(this.className)
			{
				if(this.matchValue())
				{
					if(this.animate)
					{
						this.view.scope[this.animate]['addClass'](this.element, this.className);
					}
					else
					{
						this.element.classList.add(this.className);
					}
				}
				else
				{
					if(this.animate)
					{
						this.view.scope[this.animate]['removeClass'](this.element, this.className);
					}
					else
					{
						this.element.classList.remove(this.className);
					}
				}
			}
		},

		matchValue: function()
		{
			var value = this.value;
			if(value == null) value = null;
			if(this.options.params.length > 1)
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

	return ClassBinder;

};

var ClassBinder = createClassBinder(false);
var ClassNotBinder = createClassBinder(true);

View.registerBinder('class', ClassBinder);
View.registerBinder('classnot', ClassNotBinder);

module.exports = {
	ClassBinder: ClassBinder,
	ClassNotBinder: ClassNotBinder
};
