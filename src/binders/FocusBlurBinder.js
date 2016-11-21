
import createClass from '../functions/createClass.js';
import EventBinder from './EventBinder.js';
import View from '../View.js';

var FocusBlurBinder = createClass(
{
	extend: EventBinder
},
/** @lends FocusBlurBinder.prototype */
{
	/**
	 * Two-way data binder for focus/blur event.
	 * Sets model atrribute to true when element gets focus or to false when it looses focus.
	 * Also triggers focus/blur event on attribute change.
	 * Values are passed throught eventual parsers/formatters of course.
	 *
	 * @constructs
	 * @augments EventBinder
	 * @param {Object} options Options object
	 */
	constructor: function(options)
	{
		if(options.eventNames.length === 0)	options.eventNames = ['focus blur'];
		EventBinder.call(this, options);
	},

	triggerEvent: function(event)
	{
		this.updateModel(this.view.env.document.activeElement === this.element, event);
	},

	refresh: function()
	{
		if(this.value)
		{
			if(this.view.env.document.activeElement !== this.element) this.element.focus();
		}
		else
		{
			if(this.view.env.document.activeElement === this.element) this.element.blur();
		}
	}
});

View.registerBinder('focusblur', FocusBlurBinder);

export default FocusBlurBinder;
