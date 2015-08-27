
/**
 * Detects if an object is a plain javascript object (object created as literal
 * or by new Object). Very simple implementation not as robust as the jQuery one
 * but better performing.
 *
 * @param  {mixed}  obj Object to detect
 * @return {Boolean} True if object is a plain object, false otherwise
 */
function isPlainObject(obj)
{
	return obj !== null && typeof obj === 'object' && obj.constructor === Object;
}

export default isPlainObject;
