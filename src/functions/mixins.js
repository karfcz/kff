
/**
 * Mixins (using a shallow copy) properties from one object to another.
 * Function accepts multiple arguments with multiple extending objects.
 * The first object will be extended (modified) by the following object(s).
 * When passing true as the last argument, deep copy will be executed (any object ).
 *
 * @param {Object} obj Object to be extended
 * @param {Object} properties Extending object(s)
 * @returns {Object} Extended object (=== obj)
 */
function mixins(obj, properties)
{
	var i = 1, l = arguments.length, key, props;

	while(i < l)
	{
		props = arguments[i];
		var keys = Object.keys(props);
		for(var j = 0, k = keys.length; j < k; j++)
		{
			obj[keys[j]] = props[keys[j]];
		}
		i++;
	}
	return obj;
}

export default mixins;
