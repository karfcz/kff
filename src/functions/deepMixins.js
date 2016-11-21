
import isPlainObject from './isPlainObject.js';

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
export default function deepMixins(obj, properties)
{
	var i = 1, l = arguments.length, key, props, prop, objProp;
	while(i < l)
	{
		props = arguments[i];

		var keys = Object.keys(props);

		for(var j = 0, k = keys.length; j < k; j++)
		{
			key = keys[j];
			prop = props[key];
			if(isPlainObject(prop))
			{
				objProp = obj[key];
				if(typeof objProp !== 'object' || objProp === null) obj[key] = objProp = {};
				deepMixins(objProp, prop);
			}
			else obj[key] = prop;
		}
		i++;
	}
	return obj;
}
