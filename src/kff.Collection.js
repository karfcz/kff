
kff.Collection = kff.createClass(
{
	extend: kff.List,
	mixins: kff.EventsMixin
},
/** @lends kff.Collection.prototype	*/
{
	/**
	 * Class representing a collection of models.

	 * @constructs
	 * @augments kff.List
	 * @param {Object} options Options object
	 * @param {function} options.itemFactory Factory function for creating new collection items (optional)
	 * @param {function} options.itemType Type (class or constructor function) of collection items
	 */
	constructor: function(options)
	{
		options = options || {};
		this.itemFactory = options.itemFactory || null;
		this.itemType = options.itemType || kff.Model;
		this.serializeAttrs = options.serializeAttrs || null;
		this.onEachEvents = [];
		this.initEvents();
		kff.List.call(this);
		return this;
	},

	/**
	 * Creates a new item using itemType or itemFactory if provided
	 *
	 * @returns {mixed} Created item
	 */
	createItem: function()
	{
		var item;
		if(this.itemFactory) item = this.itemFactory();
		else item = new this.itemType();
		return item;
	},

	/**
	 * Appends the item at the end of the collection
	 *
	 * Triggers a change event with folloving event object:
	 *
	 *  { type: 'append', item: item }
	 *
	 * @param {mixed} item Item to be appended
	 * @param {Boolean} silent If true, do not trigger event
	 */
	append: function(item, silent)
	{
		kff.Collection._super.append.call(this, item);
		this.bindOnOne(item);
		if(!silent) this.trigger('change', { type: 'append', item: item });
	},

	/**
	 * Concatenates collection with other collections, arrays or objects
	 *
	 * Method accepts variable length arguments, works like Array.concat
	 *
	 * @return {kff.Collection} A new collection
	 */
	concat: function()
	{
		var collection = new kff.Collection(this.options);
		var args = [];
		for(var i = 0, l = arguments.length; i < l; i++)
		{
			if(arguments[i] instanceof kff.Collection) args.push(arguments[i].array);
			else args.push(arguments[i]);
		}
		collection.array = Array.prototype.concat.apply(this.array, args);

		return collection;
	},

	/**
	 * Joins items of collection using toString method and separator
	 *
	 * Works like Array.join
	 *
	 * @return {String} Joined string
	 */
	join: function(separator)
	{
		return this.array.join(separator);
	},

	/**
	 * Creates a new collection with the results of calling a provided function on every element in this collection
	 *
	 * Works like Array.concat
	 *
	 * @param  {Function} callback Function that produces an element of the new collection, taking three arguments:
	 *                             currentValue: the current item being processed
	 *                             index: the index of the current value
	 *                             collection: the collection map was called upon
	 * @param  {mixed}	thisArg    Value to use as this when executing callback
	 * @return {kff.Collection}    Mapped collection
	 */
	map: function(callback, thisArg)
	{
		var thisArg = thisArg || undefined;
		var mappedArray;
		var array = this.array;

		if(typeof callback !== "function") {
			throw new TypeError(callback + " is not a function");
		}

		mappedArray = new Array(array.length);

		for(var i = 0, l = array.length; i < l; i++)
		{
			mappedArray[i] = callback.call(thisArg, array[i], i, this);
		}

		var mappedCollection = new kff.Collection(this.options);
		mappedCollection.array = mappedArray;

		return mappedCollection;
	},

	/**
	 * The reduce() method applies a function against an accumulator and each value of the collection
	 * (from left-to-right) has to reduce it to a single value.
	 *
	 * Works like Array.reduce
	 *
	 * @param  {Function} callback Function to execute on each value in the collection, taking four arguments:
	 *                             previousValue: The value previously returned in the last invocation of the callback, or initialValue, if supplied.
	 *                             currentValue: the current item being processed
	 *                             index: the index of the current value
	 *                             collection: the collection reduce was called upon
	 * @param  {mixed}	initialValue  Object to use as the first argument to the first call of the callback.
	 * @return {mixed}  Reduced value
	 */
	reduce: function(callback, initialValue)
	{
		var array = this.array;
		var l = array.length, value, i = 0;

		if(typeof callback !== 'function')
		{
			throw new TypeError( callback + ' is not a function' );
		}

		if(arguments.length >= 2)
		{
			value = arguments[1];
		}
		else
		{
			if(l === 0) throw new TypeError('Reduce of empty collection with no initial value');
		  	value = array[i++];
		}

		for(; i < l; i++)
		{
			value = callback(value, array[i], i, this);
		}
		return value;
	},

	/**
	 * The reduceRight() method applies a function against an accumulator and each value of the collection
	 * (from right-to-left) has to reduce it to a single value.
	 *
	 * Works like Array.reduce
	 *
	 * @param  {Function} callback Function to execute on each value in the collection, taking four arguments:
	 *                             previousValue: The value previously returned in the last invocation of the callback, or initialValue, if supplied.
	 *                             currentValue: the current item being processed
	 *                             index: the index of the current value
	 *                             collection: the collection reduce was called upon
	 * @param  {mixed}	initialValue  Object to use as the first argument to the first call of the callback.
	 * @return {mixed}  Reduced value
	 */
	reduceRight: function(callback, initialValue)
	{
		var array = this.array;
		var l = array.length, value, i = l - 1;

		if(typeof callback !== 'function')
		{
			throw new TypeError( callback + ' is not a function' );
		}

		if(arguments.length >= 2)
		{
			value = arguments[1];
		}
		else
		{
			if(l === 0) throw new TypeError('Reduce of empty collection with no initial value');
		  	value = array[i--];
		}

		for(; i >= 0; i--)
		{
			value = callback(value, array[i], i, this);
		}
		return value;
	},

	/**
	 * Inserts an item at specified index
	 *
	 * Triggers a change event with folloving event object:
	 *
	 * { type: 'insert', item: item, index: index }
	 *
	 * @param {mixed} item Item to be inserted
	 * @param {Boolean} silent If true, do not trigger event
	 */
	insert: function(item, index, silent)
	{
		kff.Collection._super.insert.call(this, item, index);
		this.bindOnOne(item);
		if(!silent) this.trigger('change', { type: 'insert', item: item, index: index });
	},

	/**
	 * Sets an item at given position
	 *
	 * Triggers a change event with folloving event object:
	 *
	 * { type: 'set', item: item, index: index }
	 *
	 * @param {number} index Index of item
	 * @param {mixed} item Item to set
	 */
	set: function(index, item, silent)
	{
		var replacedItem = this.get(index);
		if(replacedItem) this.unbindOnOne(replacedItem);
		kff.Collection._super.set.call(this, item, index);
		this.bindOnOne(item);
		if(!silent) this.trigger('change', { type: 'set', item: item, index: index });
	},

	/**
	 * Removes the item from the collection
	 *
	 * Triggers a change event with folloving event object:
	 *
	 * { type: 'remove', item: item }
	 *
	 * @param {mixed} item Reference to the item to be removed
	 * @param {Boolean} silent If true, do not trigger event
	 * @returns {mixed} Removed item or false if not found
	 *
	 */
	remove: function(item, silent)
	{
		var i, a = this.array, currentItem, removed;
		if(typeof item === 'function')
		{
			removed = [];
			for(i = a.length - 1; i >= 0; i--)
			{
				currentItem = a[i];
				if(item(currentItem) === true)
				{
					this.array.splice(i, 1);
					removed.push({ item: currentItem, index: i });
					this.unbindOnOne(currentItem);
				}
			}
			if(removed.length === 0) return false;
			else
			{
				if(!silent) this.trigger('change', { type: 'remove', items: removed });
				return removed;
			}
		}
		else
		{
			i = kff.arrayIndexOf(a, item);
			if(i === -1) return false;
			a.splice(i, 1);
			this.unbindOnOne(item);
			if(!silent) this.trigger('change', { type: 'remove', item: item, index: i });
			return i;
		}
	},

	/**
	 * Creates a new collection with items that pass filter function test
	 * @param {function} fn Test function that accepts one argument (item).
	 */
	filter: function(fn)
	{
		var filteredColllection = this.clone();
		filteredColllection.remove(function(item){
			return !fn.call(null, item);
		});
		return filteredColllection;
	},

	/**
	 * Returns the value of given attribute using deep lookup (object.attribute.some.value)
	 *
	 * @param {string} attrPath Attribute path
	 * @returns {mixed} Attribute value
	 * @example
	 * obj.mget('one.two.three');
	 * // equals to:
	 * obj.get('one').get('two').get('three');
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
	 * Creates a JSON representation of collection (= array object).
	 *
	 * If item of collection is object, tries to call toJson on it recursively.
	 * This function returns a plain object, not a stringified JSON.
	 *
	 * @returns {Array} Array representation of collection
	 */
	toJson: function()
	{
		var serializeAttrs = this.serializeAttrs, array = [];
		this.each(function(item)
		{
			if(item && item.toJson) array.push(item.toJson(serializeAttrs));
			else array.push(item);
		});
		return array;
	},

	/**
	 * Reads collection from JSON representation (= from JavaScript array)
	 *
	 * Triggers a change event with folloving event object:
	 *
	 * { type: 'fromJson' }
	 *
	 * @param {Array} array Array to read from
	 * @param {Boolean} silent If true, do not trigger event
	 */
	fromJson: function(array, silent)
	{
		var item;
		this.empty();
		for(var i = 0, l = array.length; i < l; i++)
		{
			item = this.createItem();
			item.fromJson(array[i], silent);
			this.append(item, true);
		}
		if(!silent) this.trigger('change', { type: 'fromJson' });
	},

	/**
	 * Finds an item with given attribute value
	 *
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
	 *
	 * Triggers a change event with folloving event object:
	 *
	 * { type: 'empty' }
	 *
	 * @param {Boolean} silent If true, do not trigger event
	 */
	empty: function(silent)
	{
		this.unbindEach();
		kff.Collection._super.empty.call(this);
		if(!silent) this.trigger('change', { type: 'empty' });
	},

	/**
	 * Sorts collection using a compare function. The compare function follows the same specification
	 * as the standard Array.sort function
	 *
	 * Triggers a change event with folloving event object:
	 *
	 * { type: 'sort' }
	 *
	 * @param {function} compareFunction Compare function
	 * @param {Boolean} silent If true, do not trigger event
	 */
	sort: function(compareFunction, silent)
	{
		kff.Collection._super.sort.call(this, compareFunction);
		if(!silent) this.trigger('change', { type: 'sort' });
	},

	/**
	 * Creates a clone (shallow copy) of the collection.
	 *
	 * @returns {kff.Collection} Cloned collection
	 */
	clone: function()
	{
		var clon = new kff.Collection(this.options);
		this.each(function(item){
			clon.append(item);
		});
		clon.onEachEvents = [].concat(this.onEachEvents);
		clon.rebindEach();
		return clon;
	},

	/**
	 * Randomizes items in the collection.
	 *
	 * Triggers a change event with folloving event object:
	 *
	 * { type: 'shuffle' }
	 *
	 * @param {Boolean} silent If true, do not trigger event
	 */
	shuffle: function(silent)
	{
		kff.Collection._super.shuffle.call(this);
		if(!silent) this.trigger('change', { type: 'shuffle' });
	},

	/**
	 * Splices the collection. Works exactly like the Array.splice method.
	 */
	splice: function()
	{
		this.unbindEach();
		kff.Collection._super.splice.apply(this, arguments);
		this.rebindEach();
		this.trigger('change', { type: 'splice' });
	},

	/**
	 * Binds an event handler to each item in the collection.
	 * This bindings are persistent - when new items are added to the
	 * collection, event handlers are automatically bound to them. Handlers for
	 * removed items are automatically removed as well.
	 *
	 * @param  {String}   eventType Event type
	 * @param  {Function} fn        Event handler
	 */
	onEach: function(eventType, fn)
	{
		for(var i = 0, l = this.onEachEvents.length; i < l; i++)
		{
			if(this.onEachEvents[i].eventType === eventType && this.onEachEvents[i].fn === fn)
			{
				return;
			}
		}

		this.onEachEvents.push({ eventType: eventType, fn: fn });
		this.each(function(item, i){
			item.on(eventType, fn);
		});
	},

	/**
	 * Unbinds event handler previously bound by onEach method.
	 *
	 * @param  {String}   eventType Event type
	 * @param  {Function} fn        Event handler
	 */
	offEach: function(eventType, fn)
	{
		for(var i = 0, l = this.onEachEvents.length; i < l; i++)
		{
			if(this.onEachEvents[i].eventType === eventType && this.onEachEvents[i].fn === fn)
			{
				this.onEachEvents.splice(i, 1);
				l--;
			}
		}
		this.each(function(item, i){
			item.off(eventType, fn);
		});
	},

	/**
	 * Binds 'onEach' event handlers to a newly added collection item.
	 *
	 * @private
	 * @param  {kff.Model} item A new collection item (model)
	 */
	bindOnOne: function(item)
	{
		for(var i = 0, l = this.onEachEvents.length; i < l; i++)
		{
			item.on(this.onEachEvents[i].eventType, this.onEachEvents[i].fn);
		}
	},

	/**
	 * Unbinds 'onEach' event handlers from removed collection item.
	 *
	 * @private
	 * @param  {kff.Model} item Removed collection item (model)
	 */
	unbindOnOne: function(item)
	{
		for(var i = 0, l = this.onEachEvents.length; i < l; i++)
		{
			item.off(this.onEachEvents[i].eventType, this.onEachEvents[i].fn);
		}
	},

	/**
	 * Rebinds all 'onEach' event handlers for each collection item.
	 *
	 * @private
	 */
	rebindEach: function()
	{
		var that = this;
		this.each(function(item, i)
		{
			for(var j = 0, l = that.onEachEvents.length; j < l; j++)
			{
				item.on(that.onEachEvents[j].eventType, that.onEachEvents[j].fn);
			}
		});
	},

	/**
	 * Unbinds all 'onEach' event handlers for each collection item.
	 *
	 * @private
	 */
	unbindEach: function()
	{
		var that = this;
		this.each(function(item, i)
		{
			for(var j = 0, l = that.onEachEvents.length; j < l; j++)
			{
				item.off(that.onEachEvents[j].eventType, that.onEachEvents[j].fn);
			}
		});
	}

});
