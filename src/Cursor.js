
var createClass = require('./functions/createClass');
var evalObjectPath = require('./functions/evalObjectPath');
var compareArrays = require('./functions/compareArrays');
var arrayConcat = require('./functions/arrayConcat');
var imset = require('./functions/imset');
var imremove = require('./functions/imremove');

var Cursor = createClass(
{
	constructor: function(root, keyPath)
	{
		this.root = root;
		if(typeof keyPath === 'string') keyPath = keyPath.split('.');
		this.keyPath = keyPath || [];
	},

	refine: function(keyPath)
	{
		if(typeof keyPath === 'string') keyPath = keyPath.split('.');
		return new Cursor(this.root, arrayConcat(this.keyPath, keyPath));
	},

	get: function()
	{
		// return evalObjectPath(this.keyPath, this.root);
		return this.getInPath(this.keyPath);

	},

	getIn: function(keyPath)
	{
		if(typeof keyPath === 'string') keyPath = keyPath.split('.');
		return this.getInPath(this.keyPath.concat(keyPath));
	},

	getInPath: function(path)
	{
		var part,
			obj = this.root,
			i, l;

		for(i = 0, l = path.length; i < l; i++)
		{
			part = path[i];
			if(typeof obj !== 'object' || obj === null || obj[part] === undefined) return null;
			else obj = obj[part];
		}
		return obj;
	},

	set: function(value)
	{
		var prop;
		if(this.keyPath.length === 0)
		{
			if(typeof value === 'object' && value !== null)
			{
				for(prop in value)
				{
					this.root[prop] = imset([], value[prop], this.root[prop]);
				}
			}
		}
		else
		{
			prop = this.keyPath[0];
			var keyPath = this.keyPath.slice(1);
			this.root[prop] = imset(keyPath, value, this.root[prop]);
		}
	},

	setIn: function(path, value)
	{
		this.refine(path).set(value);
	},

	update: function(fn)
	{
		if(this.keyPath.length < 1) return;
		var prop = this.keyPath[0];
		var keyPath = this.keyPath.slice(1);
		this.root[prop] = imset(keyPath, fn, this.root[prop]);
	},

	remove: function()
	{
		if(this.keyPath.length < 1) return;
		var prop = this.keyPath[0];
		var keyPath = this.keyPath.slice(1);
		this.root[prop] = imremove(keyPath, this.root[prop]);
	},

	equalsTo: function(cursor)
	{
		if(!cursor || cursor.root !== this.root) return false;
		return compareArrays(this.keyPath, cursor.keyPath);
	}

});

module.exports = Cursor;
