/**
 *  KFF Javascript microframework
 *  Copyright (c) 2008-2012 Karel Fučík
 *  Released under the MIT license.
 *  http://www.opensource.org/licenses/mit-license.php
 */

(function(scope)
{
	var kff;

	if(typeof exports !== 'undefined') kff = exports;
	else kff = 'kff' in scope ? scope.kff : (scope.kff = {}) ;

	kff.Model = kff.createClass(
	{
		mixins: kff.EventsMixin
	},
	/** @lends kff.Model */
	{
		/**
		 * Class representing a model
		 * @constructs
		 */
		constructor: function()
		{
			this.events = new kff.Events();
			this.attrs = {};
		},

		/**
		 * Checks if the model has given attribute
		 * @param {string} attr Attribute name
		 * @returns {boolean} True if found, false otherwise
		 */
		has: function(attr)
		{
			return attr in this.attrs;
		},

		/**
		 * Returns value of given attribute
		 * @param {string} attr Attribute name
		 * @returns {mixed} Attribute value
		 */
		get: function(attr)
		{
			return this.attrs[attr];
		},

		/**
		 * Returns value of given attribute using deep lookup (object.attribute.some.value)
		 * @param {string} attrPath Attribute path
		 * @returns {mixed} Attribute value
		 */
		mget: function(attrPath)
		{
			var attr;
			if(typeof attrPath === 'string') attrPath = attrPath.split('.');
			attr = this.get(attrPath.shift());
			if(attrPath.length > 0)
			{
				if(attr instanceof kff.Model) return attr.mget(attrPath);
				else return kff.evalObjectPath(attrPath, attr);
			}
			else return attr;
		},

		/**
		 * Sets value of given attribute.
		 *
		 * Triggers change event.
		 *
		 * @param {string} attr Attribute name
		 * @param {mixed} value Attribute value
		 */
		set: function(attr, value, options)
		{
			var changed = {};

			if(typeof attr === 'string')
			{
				if(this.get(attr) === value) return;
				changed[attr] = value;
				if(typeof this.validate === 'function')
				{
					if(!this.validate(changed)) return;
				}
				this.attrs[attr] = value;
			}
			else if(attr === Object(attr))
			{
				options = value;
				changed = attr;
				if(typeof this.validate === 'function')
				{
					if(!this.validate(changed)) return;
				}
				for(var key in changed) this.attrs[key] = changed[key];
			}

			for(var changedAttr in changed)
			{
				this.trigger('change:' + changedAttr, { changedAttributes: changed });
			}
			this.trigger('change', { changedAttributes: changed });
		},

		/**
		 * Creates a JSON representation of model attributes.
		 *
		 * If an attribute is type of Object, tries to call toJson on it too.
		 * This function returns plain object, not stringified JSON.
		 *
		 * @param {Array.<string>} serializeAttrs If used, only these attributes will be exported
		 * @returns {Object} Plain JavaScript object representation of attributes
		 */
		toJson: function(serializeAttrs)
		{
			var obj = {};
			for(var key in this.attrs)
			{
				if((!serializeAttrs || $.inArray(key, serializeAttrs) !== -1) && this.attrs.hasOwnProperty(key))
				{
					if(this.attrs[key] && typeof this.attrs[key] === 'object' && 'toJson' in this.attrs[key]) obj[key] = this.attrs[key].toJson();
					else obj[key] = this.attrs[key];
				}
			}
			return obj;
		},

		/**
		 * Reads model's attributes from plain JavaScript object
		 *
		 * If an attribute is type of Object, tries to read appropriate property using its fromJson method.
		 * This function returns plain object, not stringified JSON.
		 *
		 * @param {Object} obj Plain object to read from
		 */
		fromJson: function(obj)
		{
			var attrs = {};
			for(var key in this.attrs)
			{
				if(this.attrs.hasOwnProperty(key) && obj.hasOwnProperty(key))
				{
					if(this.attrs[key] && typeof this.attrs[key] === 'object' && 'fromJson' in this.attrs[key]) this.attrs[key].fromJson(obj[key]);
					else this.attrs[key] = obj[key];
				}
			}
			this.set(this.attrs);
		}

	});

})(this);
