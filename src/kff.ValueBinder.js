(function(scope)
{
	var kff;

	if(typeof exports !== 'undefined') kff = exports;
	else kff = 'kff' in scope ? scope.kff : (scope.kff = {}) ;


	kff.ValueBinder = kff.createClass(
	{
		extend: kff.Binder
	},
	/** @lends kff.ValueBinder.prototype */
	{
		/**
			@constructs
		*/
		constructor: function(options)
		{
			options = options || {};
			options.events = [
				['keydown drop change', 'inputChange']
			];
			kff.Binder.call(this, options);
		},

		inputChange: function(event)
		{
			setTimeout(this.f(function()
			{
				this.updateModel(this.$element.val());
			}), 0);
		},

		refresh: function()
		{
			this.$element.val(this.getFormattedValue());
		}
	});

	kff.CheckBinder = kff.createClass(
	{
		extend: kff.Binder
	},
	/** @lends kff.CheckBinder.prototype */
	{
		/**
			@constructs
		*/
		constructor: function(options)
		{
			options = options || {};
			options.events = [
				['click change', 'inputChange']
			];
			kff.Binder.call(this, options);
		},

		inputChange: function(event)
		{
			setTimeout(this.f(function()
			{
				this.updateModel(this.$element.is(':checked'));
			}), 0);
		},

		refresh: function()
		{
			this.$element.prop('checked', !!this.values[this.valueIndex]);
		}
	});

	kff.ClickBinder = kff.createClass(
	{
		extend: kff.Binder
	},
	/** @lends kff.ClickBinder.prototype */
	{
		/**
			@constructs
		*/
		constructor: function(options)
		{
			options = options || {};
			options.events = [
				['click', 'click']
			];
			kff.Binder.call(this, options);
		},

		init: function()
		{
			this.value = this.params[0] || null;
			kff.ClickBinder._super.init.call(this);
		},

		click: function(event)
		{
			setTimeout(this.f(function()
			{
				this.updateModel(this.value);
			}), 0);
		}
	});

	kff.RadioBinder = kff.createClass(
	{
		extend: kff.Binder
	},
	/** @lends kff.RadioBinder.prototype */
	{
		/**
			@constructs
		*/
		constructor: function(options)
		{
			options = options || {};
			options.events = [
				['click', 'inputChange']
			];
			kff.Binder.call(this, options);
		},

		inputChange: function(event)
		{
			setTimeout(this.f(function()
			{
				if(this.$element.is(':checked'))
				{
					this.updateModel(this.$element.val());
				}
			}), 0);
		},

		refresh: function()
		{
			this.$element.prop('checked', this.parse(this.$element.val()) === this.currentValue);
		}
	});


	/** @class */
	kff.TextBinder = kff.createClass(
	{
		extend: kff.Binder
	},
	/** @lends kff.TextBinder.prototype */
	{
		init: function()
		{
			kff.TextBinder._super.init.call(this);
		},

		refresh: function(value)
		{
			this.$element.text(this.values.join(' '));
		}
	});


	/** @class */
	kff.HtmlBinder = kff.createClass(
	{
		extend: kff.Binder
	},
	/** @lends kff.HtmlBinder.prototype */
	{
		refresh: function()
		{
			this.$element.html(this.values.join(' '));
		}
	});


	/** @class */
	kff.ClassBinder = kff.createClass(
	{
		extend: kff.Binder
	},
	/** @lends kff.ClassBinder.prototype */
	{
		init: function()
		{
			this.className = this.params[0] || null;
			this.equalsTo = this.params[1] || null;
			kff.ClassBinder._super.init.call(this);
		},

		refresh: function()
		{
			if(this.className) this.$element[this.matchValue() ? 'addClass' : 'removeClass'](this.className);
		},

		matchValue: function()
		{
			if(this.equalsTo) return this.values[this.valueIndex] === this.parse(this.equalsTo);
			else return this.values[this.valueIndex];
		}
	});


	/** @class */
	kff.AttrBinder = kff.createClass(
	{
		extend: kff.Binder
	},
	/** @lends kff.AttrBinder.prototype */
	{
		init: function()
		{
			this.attribute = this.params[0] || null;
			this.prefix = this.params[1] || null;
			// this.prefix = this.$element.attr('data-kff-prefix') || '';
			kff.AttrBinder._super.init.call(this);
		},

		refresh: function()
		{
			if(this.attribute) this.$element.attr(this.attribute, this.prefix + this.getFormattedValue());
		}
	});


	/**
	 * kff.TemplateView
	 */

	// kff.TemplateView = kff.createClass(
	// {
	// 	extend: kff.Binder
	// },
	// {
	// 	refresh: function(value)
	// 	{
	// 		thit.destroySubViews();
	// 		if(this.options.template && this.models['*'])
	// 		{
	// 			this.$element.html(this.options.template(this.models['*'].toJson()));
	// 		}
	// 	}
	// });


	kff.BindingView.binders.text = kff.TextBinder;
	kff.BindingView.binders['class'] = kff.ClassBinder;
	kff.BindingView.binders.val = kff.ValueBinder;
	kff.BindingView.binders.check = kff.CheckBinder;
	kff.BindingView.binders.radio = kff.RadioBinder;
	kff.BindingView.binders.html = kff.HtmlBinder;
	kff.BindingView.binders.attr = kff.AttrBinder;
	kff.BindingView.binders.click = kff.ClickBinder;


})(this);