
/**
 * Returns index of an item in an array or -1 if not found
 * This is just a faster replacement for native Array#indexOf
 * It returns index of first occurence of the item.
 *
 * @param  {Array} array The array to search in
 * @param  {mixed} item  The item to look for
 * @return {number}      Index of the item
 */
function arrayIndexOf(array, item)
{
	for(var i = 0, l = array.length; i < l; i++)
	{
		if(array[i] === item) return i;
	}
	return -1;
}

export default arrayIndexOf;
