
var createClass = require('./functions/createClass');

var Service = createClass(
{},
/** @lends Service.prototype */
{
	constructor: function(config)
	{
		this.config = config || {};
	}
});

module.exports = Service;
