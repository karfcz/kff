
// import createClass from '../functions/createClass';
// import EventBinder from './EventBinder';
// import View from '../View';

// var CallBinder = kff.createClass(
// {
// 	extend: kff.EventBinder
// },
// /** @lends kff.EventBinder.prototype */
// {
// 	/**
// 	 * One-way data binder (DOM to model) for generic DOM event.
// 	 * Calls a model method with optional parameters.
// 	 * Event defaults to click.
// 	 *
// 	 * @constructs
// 	 * @augments kff.Binder
// 	 * @param {Object} options Options object
// 	 */

// 	updateModel: function(value)
// 	{
// 		var i, l, args, fn;
// 		var callParams = this.options.params;

// 		if(this.model && this.options.attr) fn = this.model[this.options.attr];
// 		if(typeof fn !== 'function') return;

// 		args = [];
// 		for(i = 0, l = callParams.length; i < l; i++)
// 		{
// 			if(callParams[i].charAt(0) === '@') args[i] = this.view.getModel(callParams[i].slice(1));
// 			else
// 			{
// 				if(this.options.parsers.length === 0) args[i] = this.convertValueType(callParams[i]);
// 				else args[i] = this.parse(callParams[i]);
// 			}
// 		}
// 		fn.apply(this.model, args);
// 	}
// });

// kff.BindingView.registerBinder('call', kff.CallBinder);

// export default BlurBinder;
