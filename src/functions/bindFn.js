
/**
 * Binds function to an object with object's *this*.
 *
 * Note that it adds a _boundFns property to the object which is an object
 * containing references to bound methods for caching purposes. It always returns reference to the same function
 * for each fnName.
 *
 * @param {Object} obj Object to which bind a function
 * @param {string} fnName Method name to bind
 * @returns {function} Bound function
 */
function bindFn(obj, fnName, args)
{
	if(typeof obj[fnName] !== 'function') throw new TypeError('Expected function: ' + fnName + ' in object ' + obj + '  (bindFn)');
	if(!('_boundFns' in obj)) obj._boundFns = {};
	if(fnName in obj._boundFns) return obj._boundFns[fnName];
	else
	{
		obj._boundFns[fnName] = function()
		{
			if(args) return obj[fnName].apply(obj, args.concat(Array.prototype.slice.call(arguments)));
			else return obj[fnName].apply(obj, arguments);
		};
	}
	return obj._boundFns[fnName];
}

module.exports = bindFn;
