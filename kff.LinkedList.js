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
			var node = this.head.next;
			while(node)
			{
				if(fn.call(null, node.val) === false) break;
				node = node.next;
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
		}
		
	});

})(this);
