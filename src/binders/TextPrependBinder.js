
var createClass = require('../functions/createClass');
var Binder = require('../Binder');
var View = require('../View');

var TextPrependBinder = createClass(
{
	extend: Binder
},
/** @lends TextBinder.prototype */
{
	/**
	 * One-way data binder for plain text node prepended to the element.
	 *
	 * @constructs
	 * @augments Binder
	 * @param {Object} options Options object
	 */
	constructor: function(options)
	{
		Binder.call(this, options);
		this.prependedTextNode = null;
		this.addWhiteSpace = false;
		this.prefix = '';
		this.suffix = '';

		options.params.forEach(this.f(function(param)
		{
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
		this.prependedTextNode = null;
		TextPrependBinder._super.destroy.call(this);
	},

	refresh: function(value)
	{
		var val = this.value;
		if(val === null || val === undefined) val = '';

		val = this.prefix + val + this.suffix;

		if(val !== '' && this.addWhiteSpace) val = val + ' ';

		if(this.prependedTextNode) this.prependedTextNode.textContent = val;
		else
		{
			this.prependedTextNode = document.createTextNode(val);
			this.element.insertBefore(this.prependedTextNode, this.element.firstChild);
		}
	}
});

View.registerBinder('textprepend', TextPrependBinder);

module.exports = TextPrependBinder;
