
var curry = require('./curry');

var map = curry(function(fn, obj)
{
	return obj.map(fn);
});

module.exports = map;
