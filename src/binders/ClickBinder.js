
import createClass from '../functions/createClass.js';
import EventBinder from './EventBinder.js';
import View from '../View.js';

var ClickBinder = createClass(
{
	extend: EventBinder
},
/** @lends ClickBinder.prototype */
{
	/**
	 * One-way data binder (DOM to model) for click event.
	 * Sets model atrribute to defined value when click event occurs.
	 *
	 * @constructs
	 * @augments Binder
	 * @param {Object} options Options object
	 */
	constructor: function(options)
	{
		if(options.eventNames.length === 0)	options.eventNames = ['click'];
		EventBinder.call(this, options);
	}

});

View.registerBinder('click', ClickBinder);

export default ClickBinder;
