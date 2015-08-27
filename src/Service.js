
import createClass from './functions/createClass';

var Service = createClass(
{},
/** @lends Service.prototype */
{
	constructor: function(config)
	{
		this.config = config || {};
	}
});

export default Service;
