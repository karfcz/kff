var createClassBinder = function(negate)
{
	var ClassBinder = kff.createClass(
	{
		extend: kff.Binder
	},
	/** @lends kff.ClassBinder.prototype */
	{
		/**
		 * One-way data binder (model to DOM) for CSS class.
		 * Sets/Unsets the class of the element to some predefined value when model atrribute changes.
		 *
		 * @constructs
		 * @augments kff.Binder
		 * @param {Object} options Options objectt
		 */
		constructor: function(options)
		{
			kff.Binder.call(this, options);
		},

		init: function()
		{
			this.className = this.options.params[0] || null;
			this.equalsTo = true;

			if(this.options.params[1])
			{
				if(this.options.parsers.length === 0) this.equalsTo = this.convertValueType(this.options.params[1]);
				else this.equalsTo = this.parse(this.options.params[1]);
				if(this.equalsTo == null) this.equalsTo = null;
			}

			this.negate = this.options.params[2] === 'ne' || negate;

			kff.ClassBinder._super.init.call(this);
		},

		refresh: function()
		{
			if(this.className)
			{
				if(this.matchValue())
				{
					this.$element[0].classList.add(this.className);
				}
				else
				{
					this.$element[0].classList.remove(this.className);
				}
			}
		},

		matchValue: function()
		{
			if(this.options.params.length > 1)
			{
				var value = this.value;
				if(value == null) value = null;
				if(this.negate) return value !== this.equalsTo;
				else return value === this.equalsTo;
			}
			else return this.value;
		}
	});

	if(typeof document === 'object' && document !== null)
	{
		if(!('classList' in document.documentElement))
		{
			ClassBinder.prototype.refresh = function(value)
			{
				if(this.className)
				{
					this.$element[this.matchValue() ? 'addClass' : 'removeClass'](this.className);
				}
			};
		}
	}

	return ClassBinder;

};

kff.ClassBinder = createClassBinder(false);
kff.ClassNotBinder = createClassBinder(true);

kff.BindingView.registerBinder('class', kff.ClassBinder);
kff.BindingView.registerBinder('classnot', kff.ClassNotBinder);
