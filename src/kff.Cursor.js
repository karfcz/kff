
kff.Cursor = kff.createClass(
{
	constructor: function(root, keyPath)
	{
		this.root = root;
		this.keyPath = keyPath || [];
	},

	refine: function(keyPath)
	{
		return new kff.Cursor(this.root, this.keyPath.concat(keyPath));
	},

	get: function()
	{
		return kff.evalObjectPath(this.keyPath, this.root);
	},

	// getIn: function(keyPath)
	// {
	// 	return kff.evalObjectPath(this.keyPath.concat(keyPath), this.root);
	// },

	set: function(value)
	{
		if(this.keyPath.length < 1) return;
		var prop = this.keyPath[0];
		var keyPath = this.keyPath.slice(1);
		this.root[prop] = kff.imset(keyPath, value, this.root[prop]);
	},

	// setIn: function(value, keyPath)
	// {
	// 	this.refine(keyPath).set(value);
	// },

	update: function(fn)
	{
		if(this.keyPath.length < 1) return;
		var prop = this.keyPath[0];
		var keyPath = this.keyPath.slice(1);
		this.root[prop] = kff.imset(keyPath, fn, this.root[prop]);
	},

	remove: function()
	{
		if(this.keyPath.length < 1) return;
		var prop = this.keyPath[0];
		var keyPath = this.keyPath.slice(1);
		this.root[prop] = kff.imremove(keyPath, this.root[prop]);
	}

});
