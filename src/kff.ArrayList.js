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
	{
		constructor: function()
		{
			this.array = [];
			this.count = this.array.length;
		},

		each: function(fn)
		{
			var a = this.array, l = a.length, i = 0;
			for(; i < l; i++)
			{
				if(fn.call(null, a[i], i) === false) break;
			}
		},

		append: function(val)
		{
			this.array.push(val);
			this.count++;
		},

		removeVal: function(val)
		{
			var i = this.indexOf(val);
			if(i === -1) return false;

			this.array.splice(i, 1);
			this.count--;

			return true;
		},

		empty: function()
		{
			this.array = [];
			this.count = 0;
		},

		indexOf: function(val)
		{
			var i = 0, a = this.array, l = a.length;
			if(a.indexOf) return a.indexOf(val);
			for(; i < l; i++) if(a[i] === val) return val;
			return -1;
		},

		/**
			Returns an item at given position

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
		}

	});

})(this);
