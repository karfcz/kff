
kff.Model = kff.createClass(
{
	mixins: kff.EventsMixin
},
/** @lends kff.Model.prototype */
{
	/**
	 * Base class for models
	 * @constructs
	 */
	constructor: function(attrs)
	{
		this.initEvents();

		/**
		 * Attributes of model
		 * @private
		 */
		this.attrs = this.attrs || {};

		if(attrs) this.set(attrs);
	},

	/**
	 * Checks if the model has given attribute
	 *
	 * @public
	 * @param {string} attr Attribute name
	 * @returns {boolean} True if found, false otherwise
	 */
	has: function(attr)
	{
		return attr in this.attrs;
	},

	/**
	 * Returns the value of given attribute
	 *
	 * @param {string} attr Attribute name
	 * @returns {mixed} Attribute value
	 */
	get: function(attr)
	{
		return this.attrs[attr];
	},

	/**
	 * Returns the value of given attribute using deep lookup (object.attribute.some.value)

	 * @param {string} attrPath Attribute path
	 * @returns {mixed} Attribute value
	 * @example
	 *     obj.mget('one.two.three');
	 *     // equals to:
	 *     obj.get('one').get('two').get('three');
	 */
	mget: function(attrPath)
	{
		var attr;
		if(typeof attrPath === 'string') attrPath = attrPath.split('.');
		attr = this.get(attrPath.shift());
		if(attrPath.length > 0)
		{
			if(attr instanceof kff.Model || attr instanceof kff.Collection) return attr.mget(attrPath);
			else return kff.evalObjectPath(attrPath, attr);
		}
		else return attr;
	},

	/**
	 * Sets the value(s) of given attribute(s). Triggers a change event.
	 *
	 * @param {string|Object} attr Attribute name
	 * @param {mixed} value Attribute value
	 * @param {Boolean} silent If true, do not trigger event
	 */
	set: function(attr, value, silent)
	{
		var changed = {};

		if(typeof attr === 'string')
		{
			if(this.get(attr) === value) return;
			changed[attr] = value;
			this.attrs[attr] = value;
		}
		else if(attr !== null && attr instanceof Object)
		{
			silent = value;
			changed = attr;
			for(var key in changed) this.attrs[key] = changed[key];
		}

		if(!silent)
		{
			for(var changedAttr in changed)
			{
				this.trigger('change:' + changedAttr, { model: this, changed: changed, changedAttributes: changed });
			}
			this.trigger('change', { model: this, changed: changed, changedAttributes: changed });
		}
	},

	/**
	 * Unsets (deletes) the attribute(s). Triggers a change event.
	 *
	 * @param {string|Array} attr Attribute name or array of attribute names
	 * @param {Boolean} silent If true, do not trigger event
	 */
	unset: function(attr,  silent)
	{
		var changed = {};

		if(typeof attr === 'string')
		{
			if(attr in this.attrs) delete this.attrs[attr];
			changed[attr] = undefined;
		}
		else if(attr !== null && attr instanceof Array)
		{
			for(var i = 0, l = attr.length; i < l; i++)
			{
				if(attr[i] in this.attrs)
				{
					delete this.attrs[attr[i]];
					changed[attr[i]] = undefined;
				}
			}
		}

		if(!silent)
		{
			for(var changedAttr in changed)
			{
				this.trigger('change:' + changedAttr, { model: this, changed: changed, changedAttributes: changed });
			}
			this.trigger('change', { model: this, changed: changed, changedAttributes: changed });
		}
	},

	unsetAll: function(silent)
	{
		var unset = [];

		for(var attr in this.attrs)
		{
			unset.push(attr);
		}

		this.unset(unset, silent);
	},

	/**
	 * Exports a JSON representation of model attributes. If an attribute is type of Object, tries to call a toJson
	 * method recursively.	This function returns a plain javascript object, not the stringified JSON.
	 *
	 * @param {Array.<string>} serializeAttrs Array of attribute names to be exported or all if omitted.
	 * @returns {Object} Plain JavaScript object representation of object's attributes
	 */
	toJson: function(serializeAttrs)
	{
		var obj = {};
		for(var key in this.attrs)
		{
			if((!serializeAttrs || kff.arrayIndexOf(serializeAttrs, key) !== -1) && this.attrs.hasOwnProperty(key))
			{
				if(this.attrs[key] && typeof this.attrs[key] === 'object' && 'toJson' in this.attrs[key]) obj[key] = this.attrs[key].toJson();
				else obj[key] = this.attrs[key];
			}
		}
		return obj;
	},

	/**
	 * Imports model's attributes from JSON (plain JavaScript object).
	 *
	 * If the attribute is type of Object, tries to read appropriate property using its fromJson method.
	 * This function returns plain object, not stringified JSON.
	 *
	 * @param {Object} obj Plain JS object to read attributes from
	 * @param {Boolean} silent If true, do not trigger event
	 */
	fromJson: function(obj, silent)
	{
		if(!obj) return;
		var attrs = {};
		for(var key in this.attrs)
		{
			if(this.attrs.hasOwnProperty(key) && obj.hasOwnProperty(key))
			{
				if(this.attrs[key] && typeof this.attrs[key] === 'object' && 'fromJson' in this.attrs[key]) this.attrs[key].fromJson(obj[key]);
				else this.attrs[key] = obj[key];
			}
		}
		this.set(this.attrs, silent);
	},

	/**
	 * Creates a new computed attribute.
	 *
	 * Computed attribute is like a normal attribute except its value is automatically recomputed each time the
	 * depending attributes change.
	 *
	 * @param  {String}   attr  A name of computed property
	 * @param  {Array}   attrs Array of attributes the computed attribute is depending on
	 * @param  {Function|String} fn    Function to be called when any of depending attributes changes. Arguments of this functin are depending attributes, returns a computed value.
	 */
	createComputed: function(attr, attrs, fn)
	{
		var computed, i, l;
		if(!this._computed) this._computed = [];

		computed = {
			args: [attr, attrs, fn],
			boundFn: this.f(function()
			{
				var vals = [];
				for(i = 0, l = attrs.length; i < l; i++)
				{
					vals[i] = this.get(attrs[i]);
				}
				this.set(attr, this.f(fn).apply(this, vals));
			})
		};

		this._computed.push(computed);

		for(i = 0, l = attrs.length; i < l; i++)
		{
			this.on('change:' + attrs[i], computed.boundFn);
		}

		computed.boundFn();
	},

	/**
	 * Iterates over model's attributes
	 * @param  {Function} fn Function to be called for each attribute. Arguments are (key, value).
	 */
	each: function(fn)
	{
		var key, attrs = this.attrs;
		for(key in attrs)
		{
			fn(key, attrs[key]);
		}
	}

});

(function()
{
	var createGetter = function(attr)
	{
		return function(value)
		{
			if(arguments.length === 0)	return this.get(attr);
			else return this.set(attr, value);
		};
	};

	kff.createModelClass = function(meta, properties)
	{
		if(arguments.length === 1)
		{
			properties = meta;
			meta = {};
		}

		if(!('extend' in meta)) meta.extend = kff.Model;

		var modelClass = kff.createClass(meta, properties);

		if('service' in modelClass && 'args' in modelClass.service)
		{
			var attrs = modelClass.service.args['0'];
			if(typeof attrs === 'object' && attrs !== null)
			{
				for(var attr in attrs)
				{
					if(!(attr in modelClass.prototype)) modelClass.prototype[attr] = createGetter(attr);
				}
			}
		}
		return modelClass;
	};

})();