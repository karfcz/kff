
kff.BinderMap = kff.createClass(
{
	constructor: function()
	{
		this.binders = {};
		this.values = {};
	},

	add: function(binderName, binder)
	{
		if(!(binderName in this.binders))
		{
			this.binders[binderName] = [];
			this.values[binderName] = [];
		}
		this.binders[binderName].push(binder);
		this.values[binderName].push(null);
		binder.valueIndex = this.binders[binderName].length - 1;
		binder.values = this.values[binderName];
	},

	clone: function(options)
	{
		var clonedBinderMap = new kff.BinderMap(),
			clonedBinders = clonedBinderMap.binders,
			clonedValues = clonedBinderMap.values,
			b, i, l, mb, mv;

		for(b in this.binders)
		{
			clonedBinders[b] = mb = [].concat(this.binders[b]);
			clonedValues[b] = mv = [].concat(this.values[b]);
			for(i = 0, l = mb.length; i < l; i++)
			{
				mb[i] = mb[i].clone();
				mv[i] = null;
			}
		}
		return clonedBinderMap;
	},

	setView: function(view)
	{
		var b, i, mb, mv, l;
		for(b in this.binders)
		{
			for(i = 0, mb = this.binders[b], mv = this.values[b], l = mb.length; i < l; i++)
			{
				mv[i] = null;
				mb[i].view = view;
				mb[i].$element = view.$element;
				mb[i].model = view.getModel([].concat(mb[i].modelPathArray));
				mb[i].values = mv;
			}
		}
	},

	initBinders: function()
	{
		for(var b in this.binders)
		{
			for(var i = 0, mb = this.binders[b], l = mb.length; i < l; i++) mb[i].init();
		}
	},

	destroyBinders: function()
	{
		for(var b in this.binders)
		{
			for(var i = 0, mb = this.binders[b], l = mb.length; i < l; i++) mb[i].destroy();
		}
	},

	refreshBinders: function(event)
	{
		for(var b in this.binders)
		{
			for(var i = 0, mb = this.binders[b], l = mb.length; i < l; i++) mb[i].modelChange(true);
		}
	}

});
