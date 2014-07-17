
kff.ModelPathWatcher = kff.createClass(
{
	mixins: kff.EventsMixin
},
{
	constructor: function(model, attrPath)
	{
		if(arguments.length === 1)
		{
			attrPath = model;
			model = null;
		}
		if(typeof attrPath === 'string') attrPath = attrPath.split('.');
		if(model === null)
		{
			model = window;
		}
		this.attr = attrPath.pop();
		this.rootModel = model;
		this.model = null;
		this.modelPathArray = attrPath;
		this.dynamicBindings = [];
	},

	init: function()
	{
		var model = this.rootModel,
			attr;

		this.dynamicBindings = [];

		for(var i = 0, l = this.modelPathArray.length; i < l; i++)
		{
			attr = this.modelPathArray[i];
			if(model instanceof kff.Model)
			{
				model.on('change:' + attr, this.f('rebindTimed'));
				this.dynamicBindings.push({ model: model, attr: attr });
				model = model.get(attr);
			}
			else if(model !== null && typeof model === 'object' && (attr in model)) model = model.attr;
			else model = null;
		}
		if(model instanceof kff.Model) this.model = model;
		else this.model = null;

		if(this.model instanceof kff.Model)
		{
			this.bindModel();
		}
	},

	destroy: function()
	{
		if(this.model instanceof kff.Model)
		{
			this.unbindModel();
		}

		if(this.dynamicBindings)
		{
			for(var i = 0, l = this.dynamicBindings.length; i < l; i++)
			{
				this.dynamicBindings[i].model.off('change:' + this.dynamicBindings[i].attr, this.f('rebindTimed'));
			}
			this.dynamicBindings = null;
		}
	},

	rebindTimed: function(event)
	{
		// this.rebind();
		kff.setZeroTimeout(this.f('rebind'));
	},

	rebind: function(event)
	{
		this.destroy();
		this.init();
		this.modelChange(true);
	},

	bindModel: function()
	{
		this.model.on('change' + (this.attr === null ? '' : ':' + this.attr), this.f('modelChange'));
	},

	unbindModel: function()
	{
		this.model.off('change' + (this.attr === null ? '' : ':' + this.attr), this.f('modelChange'));
	},

	modelChange: function(event)
	{
		this.trigger('change' + (this.attr === null ? '' : ':' + this.attr), event);
	}

});
