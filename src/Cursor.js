
var createClass = require('./functions/createClass');
var compareArrays = require('./functions/compareArrays');
var arrayConcat = require('./functions/arrayConcat');
var imset = require('./functions/imset');
var imremove = require('./functions/imremove');

var Cursor = createClass(
{
	constructor: function(root, keyPath)
	{
		if(typeof keyPath === 'string') keyPath = keyPath.split('.');
		this.keyPath = keyPath || [];

		if(root instanceof Cursor)
		{
			this.superRoot = root.superRoot;
			this.keyPath = arrayConcat(root.keyPath, this.keyPath);
		}
		else this.superRoot = { root: root };
	},

	refine: function(keyPath)
	{
		return new Cursor(this, keyPath);
	},

	get: function()
	{
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
			obj = this.superRoot.root,
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
		this.superRoot.root = imset(this.keyPath, value, this.superRoot.root);
	},

	setIn: function(path, value)
	{
		this.refine(path).set(value);
	},

	update: function(fn)
	{
		this.superRoot.root = imset(this.keyPath, fn, this.superRoot.root);
	},

	remove: function()
	{
		this.superRoot.root = imremove(this.keyPath, this.superRoot.root);
	},

	equalsTo: function(cursor)
	{
		if(!cursor || cursor.superRoot.root !== this.superRoot.root) return false;
		return compareArrays(this.keyPath, cursor.keyPath);
	}

});

module.exports = Cursor;
