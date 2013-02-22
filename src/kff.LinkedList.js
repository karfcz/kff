
kff.LinkedList = kff.createClass(
/** @lends kff.LinkedList */
{
	/**
	 * Class representing a linked list data structure
	 * @constructs
	 */
	constructor: function()
	{
		this.tail = this.head = { next: null };
		this.count = 0;
	},

	/**
	 * Iterates over each item in the list
	 * @param {function} fn function to be called on each item. Takes one argument - the iterated item
	 */
	each: function(fn)
	{
		var node = this.head.next, i = 0;
		while(node)
		{
			if(fn.call(null, node.val, i) === false) break;
			node = node.next;
			i++;
		}
	},

	/**
	 * Appends an item at the end of the list
	 * @param {mixed} val Item to be appended
	 */
	append: function(val)
	{
		var node = { val: val, next: null };
		this.tail.next = node;
		this.tail = node;
		this.count++;
	},

	/**
	 * Removes item from the list
	 * @param {mixed} val Reference to the item to be removed
	 * @returns {mixed} removed item or false if not found
	 */
	removeVal: function(val)
	{
		var node = this.head.next, prev = this.head, ret = false;
		while(node)
		{
			if(node.val === val)
			{
				if(node.next) prev.next = node.next;
				else
				{
					prev.next = null;
					this.tail = prev;
				}
				this.count--;
				ret = true;
			}
			else prev = node;
			node = node.next;
		}
		return ret;
	},

	/**
	 * Removes all items from list
	 */
	empty: function()
	{
		this.tail = this.head = { next: null };
		this.count = 0;
	},

	indexOf: function(val)
	{
		var node = this.head.next, prev = this.head, i = 0;
		while(node)
		{
			if(node.val === val)
			{
				return i;
			}
			node = node.next;
			i++;
		}
		return -1;
	}


});
