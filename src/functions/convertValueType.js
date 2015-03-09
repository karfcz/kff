
/**
 * Converts string from binder atribute to primitive type using some basic implicit rules.
 * 'null' => null
 * 'true' => true
 * 'false' => false
 * numeric values => number
 * otherwise => keep original string
 *
 * @private
 * @param  {string} value Original value
 * @return {mixed}        Converted value
 */
function convertValueType(value)
{
	if(value === 'null') return null;
	if(value === 'true') return true;
	if(value === 'false') return false;
	var n = value - 0;
	if(n == value) return n;
	return value;
}

module.exports = convertValueType;
