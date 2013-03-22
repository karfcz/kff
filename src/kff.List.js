
kff.List = kff.createClass(
/** @lends kff.List.prototype */
{
	/**
		Class representing a list data structure
		@constructs
	 */
	constructor: function()
	{
		this.array = [];
		this.count = this.array.length;
	},

	/**
		Iterates over each item in the list
		@param {function} fn A callback function to be called on each item. Takes two arguments - the iterated item and its index
	 */
	each: function(fn)
	{
		var a = this.array, l = a.length, i = 0;
		for(; i < l; i++)
		{
			if(fn.call(null, a[i], i) === false) break;
		}
	},

	/**
		Appends an item at the end of the list
		@param {mixed} val Item to be appended
	 */
	append: function(val)
	{
		this.array.push(val);
		this.count++;
	},

	/**
		Inserts an item at specified index
		@param {mixed} val Item to be inserted
	 */
	insert: function(val, index)
	{
		this.array.splice(index, 0, val);
		this.count++;
	},

	/**
		Removes item from the list
		@param {mixed} val Reference to the item to be removed
		@returns {Boolean} True if item was removed or false if not found
	 */
	remove: function(val)
	{
		var i = this.indexOf(val);
		if(i === -1) return false;

		this.array.splice(i, 1);
		this.count--;

		return true;
	},

	/**
		Removes all items from the list
	 */
	empty: function()
	{
		this.array = [];
		this.count = 0;
	},

	/**
		Returns an index of given item

		@param {mixed} val Value to be found
		@returns {number} index of the item or -1 if not found
	 */
	indexOf: function(val)
	{
		var i = 0, a = this.array, l = a.length;
		if(a.indexOf) return a.indexOf(val);
		for(; i < l; i++) if(a[i] === val) return i;
		return -1;
	},

	/**
		Returns an item at given position

		@param {number} index Index of item
		@returns {mixed} Item at given position (or undefined if not found)
	 */
	findByIndex: function(index)
	{
		return this.array[index];
	},

	/**
		Sorts list using a compare function. The compare function follows the same specification
		as the standard Array.sort function

		@param {function} compareFunction Compare function
	 */
	sort: function(compareFunction)
	{
		this.array.sort(compareFunction);
	},

	/**
		Randomizes items in the list.
	 */
	shuffle: function()
	{
		var arr = this.array,
			len = arr.length,
			i = len,
			p, t;

		while(i--)
		{
			p = parseInt(Math.random()*len, 10);
			t = arr[i];
			arr[i] = arr[p];
			arr[p] = t;
		}
	}

});

// Backward-compatible alias:
kff.List.prototype.removeVal = kff.List.prototype.remove;
