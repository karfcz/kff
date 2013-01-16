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

	kff.Collection = kff.createClass(
	{ 
		extend: kff.LinkedList,
		mixins: kff.EventsMixin
	},
	/** @lends kff.Collection */
	{ 
		/**
		 * Class representing collection of models
		 * @constructs
		 * @param {Object} options Options config
		 * @param {function} options.valFactory Factory function for creating new collection items (optional)
		 * @param {function} options.valType Type (class or constructor function) of collection items
		 */		
		constructor: function(options)
		{
			options = options || {};
			this.valFactory = options.valFactory || null;
			this.valType = options.valType || kff.Model;
			this.serializeAttrs = options.serializeAttrs || null;
			this.events = new kff.Events();
			kff.LinkedList.call(this);
			return this;
		},
		
		/**
		 * Appends an item at the end of collection
		 * @param {mixed} val Item to be appended
		 */
		append: function(val)
		{
			kff.Collection._super.append.call(this, val);
			this.trigger('change', { addedValue: val });
		},

		/**
		 * Removes item from collection
		 * @param {mixed} val Reference to the item to be removed
		 * @returns {mixed} removed item or false if not found
		 */		
		removeVal: function(val)
		{
			var ret = kff.Collection._super.removeVal.call(this, val);
			if(ret) this.trigger('change', { removedValue: val });
			return ret;
		},

		/**
		 * Creates a JSON representation of collection. 
		 *
		 * If item of collection is object, tries to call toJson on it as well.
		 * This function returns plain object, not stringified JSON.
		 * Collection is represented as array in JSON.
		 *
		 * @returns {Array} Array representation of collection
		 */
		toJson: function()
		{
			var serializeAttrs = this.serializeAttrs, obj = [];
			this.each(function(val)
			{
				if(val && val.toJson) obj.push(val.toJson(serializeAttrs));
				else obj.push(val);
			});			
			return obj;
		},

		/**
		 * Reads collection from JSON (in fact JavaScript array)
		 *
		 * @param {Array} obj Array to read from
		 */		
		fromJson: function(obj)
		{
			var val, valFactory = this.valFactory;
			this.empty();
			for(var i = 0; i < obj.length; i++)
			{
				if(valFactory) val = valFactory(obj[i]);
				else val = new this.valType();
				val.fromJson(obj[i]);
				this.append(val);
			}
			this.trigger('change', { fromJson: true });
		},
		
		/**
		 * Search in collection for model with given attribute value
		 * @param {string} attr Attribute name
		 * @param {mixed} value Attribute value
		 * @returns {mixed} First found item or null
		 */
		findByAttr: function(attr, value)
		{
			var ret = null;
			this.each(function(val)
			{
				if(val && val.get(attr) === value)
				{
					ret = val;
					return false;
				}
			});
			return ret;
		},
		
		/**
		 * Removes all items from collection
		 */		
		empty: function()
		{
			kff.Collection._super.empty.call(this);
			this.trigger('change');
		},

		/**
		 * Sorts collection using a compare function
		 * 
		 * Comapre function follows the same specification as in standard Array.sort function
		 *
		 * @param {function} compareFunction Compare function
		 */		
		sort: function(compareFunction)
		{
			var arr = [], az, bz;
			this.each(function(item)
			{
				arr.push(item);
			});
			arr.sort(compareFunction);
			this.empty();
			for(var i = 0; i < arr.length; i++)
			{
				this.append(arr[i]);
			}
			this.trigger('change');
		},
		
		/**
		 * Creates clone of the collection. Clone is shallow copy (objects in collections are not cloned)
		 * @returns {kff.Collection} Cloned collection
		 */
		clone: function()
		{
			var clon = new kff.Collection(this.options);
			this.each(function(item){
				clon.append(item);
			});
			return clon;
		},
		
		/**
		 * Randomizes order of items in collection
		 */
		shuffle: function()
		{
			var arr = [], az, bz, len, i, p, t;
			this.each(function(item)
			{
				arr.push(item);
			});

			len = arr.length, i = len;
			while(i--)
			{
				p = parseInt(Math.random()*len, 10);
				t = arr[i];
				arr[i] = arr[p];
				arr[p] = t;
			}
			this.empty();
			for(i = 0; i < arr.length; i++)
			{
				this.append(arr[i]);
			}
			this.trigger('change');
		}	
		
	});

})(this);
