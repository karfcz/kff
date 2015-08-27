
import curry from './curry';

var map = curry(function(fn, obj)
{
	return obj.map(fn);
});

export default map;
