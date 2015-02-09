
kff.arrayConcat = function(a1, a2)
{
	var l1 = a1.length, l2 = a2.length, l3 = l1 + l2; i = 0;
	var a3 = new Array(l3);
	while(i < l1)
	{
		a3[i] = a1[i];
		i++;
	}
	while(i < l3)
	{
		a3[i] = a2[i - l1];
		i++
	}
	return a3;
};

kff.Cursor = kff.createClass(
{
	constructor: function(root, keyPath)
	{
		this.root = root;
		this.keyPath = keyPath || [];
	},

	refine: function(keyPath)
	{
		return new kff.Cursor(this.root, kff.arrayConcat(this.keyPath, keyPath));
		// return new kff.Cursor(this.root, this.keyPath.concat(keyPath));
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