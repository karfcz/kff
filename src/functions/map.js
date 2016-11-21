
import curry from './curry.js';

var map = curry(function(fn, obj)
{
	return obj.map(fn);
});

export default map;
