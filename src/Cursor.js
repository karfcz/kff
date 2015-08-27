
import createClass from './functions/createClass';
import evalObjectPath from './functions/evalObjectPath';
import compareArrays from './functions/compareArrays';
import arrayConcat from './functions/arrayConcat';
import imset from './functions/imset';
import imremove from './functions/imremove';

var Cursor = createClass(
{
	constructor: function(root, keyPath)
	{
		this.root = root;
		this.keyPath = keyPath || [];
	},

	refine: function(keyPath)
	{
		if(typeof keyPath === 'string') keyPath = keyPath.split('.');
		return new Cursor(this.root, arrayConcat(this.keyPath, keyPath));
	},

	get: function()
	{
		return evalObjectPath(this.keyPath, this.root);
	},

	getIn: function(keyPath)
	{
		if(typeof keyPath === 'string') keyPath = keyPath.split('.');
		return evalObjectPath(this.keyPath.concat(keyPath), this.root);
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

export default Cursor;
