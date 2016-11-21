
import createClass from '../functions/createClass.js';
import EventBinder from './EventBinder.js';
import View from '../View.js';

var DoubleClickBinder = createClass(
{
	extend: EventBinder
},
/** @lends DoubleClickBinder.prototype */
{
	/**
	 * One-way data binder (DOM to model) for double click event.
	 * Sets model atrribute to defined value when dblclick event occurs.
	 *
	 * @constructs
	 * @augments Binder
	 * @param {Object} options Options object
	 */
	constructor: function(options)
	{
		if(options.eventNames.length === 0)	options.eventNames = ['dblclick'];
		EventBinder.call(this, options);
	}

});

View.registerBinder('dblclick', DoubleClickBinder);

export default DoubleClickBinder;
