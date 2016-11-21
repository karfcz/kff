
import createClass from '../functions/createClass.js';
import EventBinder from './EventBinder.js';
import View from '../View.js';

var BlurBinder = createClass(
{
	extend: EventBinder
},
/** @lends BlurBinder.prototype */
{
	/**
	 * One-way data binder (DOM to model) for blur event.
	 * Sets model atrribute to defined value when element looses focus.
	 *
	 * @constructs
	 * @augments EventBinder
	 * @param {Object} options Options object
	 */
	constructor: function(options)
	{
		if(options.eventNames.length === 0)	options.eventNames = ['blur'];
		EventBinder.call(this, options);
	}

});

View.registerBinder('blur', BlurBinder);

export default BlurBinder;
