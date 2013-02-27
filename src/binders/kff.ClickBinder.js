
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
		event.preventDefault();
	},

	updateModel: function(value)
	{
		var i, l;
		if(value instanceof Array)
		{
			for(i = 0, l = value.length; i < l; i++) value[i] = this.parse(value[i]);
		}
		else
		{
			value = this.parse(value);
		}
		this.currentValue = value;
		if(this.setter && typeof this.model[this.setter] === 'function') this.model[this.setter](this.currentValue);
		else this.model.set(this.attr, this.currentValue);
	}

});

kff.BindingView.registerBinder('click', kff.ClickBinder);

