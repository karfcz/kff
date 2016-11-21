
import createClass from '../functions/createClass.js';
import Binder from '../Binder.js';
import View from '../View.js';

var TextAppendBinder = createClass(
{
	extend: Binder
},
/** @lends TextBinder.prototype */
{
	/**
	 * One-way data binder for plain text node appended to the element.
	 *
	 * @constructs
	 * @augments Binder
	 * @param {Object} options Options object
	 */
	constructor: function(options)
	{
		Binder.call(this, options);
		this.appendedTextNode = null;
		this.addWhiteSpace = false;
		this.prefix = '';
		this.suffix = '';

		options.params.forEach(this.f(function(param){
			if(param.type === 'namedParam')
			{
				if(param.name === 'ws' && param.operand.value === true)
				{
					this.addWhiteSpace = true;
				}
				else if(param.name === 'prefix')
				{
					this.prefix = param.operand.value;
				}
				else if(param.name === 'suffix')
				{
					this.suffix = param.operand.value;
				}
			}
		}));
	},

	destroy: function()
	{
		this.appendedTextNode = null;
		TextAppendBinder._super.destroy.call(this);
	},

	refresh: function(value)
	{
		var val = this.value;
		if(val === null || val === undefined) val = '';

		val = this.prefix + val + this.suffix;

		if(val !== '' && this.addWhiteSpace) val = ' ' + val;

		if(this.appendedTextNode) this.appendedTextNode.textContent = val;
		else
		{
			this.appendedTextNode = document.createTextNode(val);
			this.element.appendChild(this.appendedTextNode);
		}
	}
});

View.registerBinder('textappend', TextAppendBinder);

export default TextAppendBinder;