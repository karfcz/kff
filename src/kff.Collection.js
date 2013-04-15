
kff.Collection = kff.createClass(
{
	extend: kff.List,
	mixins: kff.EventsMixin
},
/** @lends kff.Collection.prototype	*/
{
	/**
		Class representing a collection of models.

		@constructs
		@augments kff.List
		@param {Object} options Options object
		@param {function} options.valFactory Factory function for creating new collection items (optional)
		@param {function} options.valType Type (class or constructor function) of collection items
	 */
	constructor: function(options)
	{
		options = options || {};
		this.valFactory = options.valFactory || null;
		this.valType = options.valType || kff.Model;
		this.serializeAttrs = options.serializeAttrs || null;
		this.initEvents();
		kff.List.call(this);
		return this;
	},

	/**
		Appends the item at the end of the collection

		@param {mixed} val Item to be appended
		@param {Boolean} silent If true, do not trigger event
	 */
	append: function(val, silent)
	{
		kff.Collection._super.append.call(this, val);
		if(!silent) this.trigger('change', { addedValue: val });
	},

	/**
		Inserts an item at specified index

		@param {mixed} val Item to be inserted
		@param {Boolean} silent If true, do not trigger event
	 */
	insert: function(val, index, silent)
	{
		kff.Collection._super.insert.call(this, val, index);
		if(!silent) this.trigger('change', { insertedValue: val, insertedIndex: index });
	},

	/**
		Sets an item at given position

		@param {number} index Index of item
		@param {mixed} item Item to set
	 */
	set: function(index, val, silent)
	{
		kff.Collection._super.set.call(this, val, index);
		if(!silent) this.trigger('change', { setValue: val, setIndex: index });
	},

	/**
		Removes the item from the collection

		@param {mixed} val Reference to the item to be removed
		@param {Boolean} silent If true, do not trigger event
		@returns {mixed} Removed item or false if not found
	 */
	remove: function(val, silent)
	{
		var ret = kff.Collection._super.remove.call(this, val);
		if(ret && !silent) this.trigger('change', { removedValue: val });
		return ret;
	},

	/**
		Returns the value of given attribute using deep lookup (object.attribute.some.value)

		@param {string} attrPath Attribute path
		@returns {mixed} Attribute value
	 	@example
	 	obj.mget('one.two.three');
	 	// equals to:
	 	obj.get('one').get('two').get('three');
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
		Creates a JSON representation of collection (= array object).

		If item of collection is object, tries to call toJson on it recursively.
		This function returns a plain object, not a stringified JSON.

		@returns {Array} Array representation of collection
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
		Reads collection from JSON representation (= from JavaScript array)

		@param {Array} obj Array to read from
		@param {Boolean} silent If true, do not trigger event
	 */
	fromJson: function(obj, silent)
	{
		var val, valFactory = this.valFactory;
		this.empty();
		for(var i = 0; i < obj.length; i++)
		{
			if(valFactory) val = valFactory(obj[i]);
			else val = new this.valType();
			val.fromJson(obj[i], silent);
			this.append(val, true);
		}
		if(!silent) this.trigger('change', { fromJson: true });
	},

	/**
		Finds an item with given attribute value

		@param {string} attr Attribute name
		@param {mixed} value Attribute value
		@returns {mixed} First found item or null
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
		Removes all items from collection

		@param {Boolean} silent If true, do not trigger event
	 */
	empty: function(silent)
	{
		kff.Collection._super.empty.call(this);
		if(!silent) this.trigger('change');
	},

	/**
		Sorts collection using a compare function. The compare function follows the same specification
		as the standard Array.sort function

		@param {function} compareFunction Compare function
		@param {Boolean} silent If true, do not trigger event
	 */
	sort: function(compareFunction, silent)
	{
		kff.Collection._super.sort.call(this, compareFunction);
		if(!silent) this.trigger('change');
	},

	/**
		Creates a clone (shallow copy) of the collection.

		@returns {kff.Collection} Cloned collection
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
		Randomizes items in the collection.

		@param {Boolean} silent If true, do not trigger event
	 */
	shuffle: function(silent)
	{
		kff.Collection._super.shuffle.call(this);
		if(!silent) this.trigger('change');
	}

});

kff.Collection.prototype.removeVal = kff.Collection.prototype.remove;