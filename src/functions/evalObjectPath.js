
/**
 * Evaluates key path of an object recursively and returns last property in chain
 *
 * Example:
 * window.something = { foo: { bar: 42 } };
 * evalObjectPath('something.foo.bar', window) === 42 // true
 *
 * @param {string} path object path (like 'something.foo.bar')
 * @param {Object} obj Object to start with (like window)
 * @returns {mixed} Property at the end of object chain or null if not found
 */

var scope = window  || this;

function evalObjectPath(path, obj)
{
	var part, i, l;
	obj = obj || scope;
	if(typeof path === 'string') path = path.split('.');
	if(!(path instanceof Array)) return null;
	for(i = 0, l = path.length; i < l; i++)
	{
		part = path[i];
		if(obj[part] === undefined) return null;
		else obj = obj[part];
	}
	return obj;
};

module.exports = evalObjectPath;
