
var createClass = require('../functions/createClass');
var Binder = require('../Binder');
var View = require('../View');

var TextBinder = createClass(
{
	extend: Binder
},
/** @lends TextBinder.prototype */
{
	/**
	 * One-way data binder for plain text content of the element.
	 * Renders text content of the element on change of the bound model attribute.
	 *
	 * @constructs
	 * @augments Binder
	 * @param {Object} options Options object
	 */
	constructor: function(options)
	{
		Binder.call(this, options);
		this.prefix = '';
		this.suffix = '';

		options.params.forEach(this.f(function(param)
		{
			if(param.type === 'namedParam')
			{
				if(param.name === 'prefix')
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

	refresh: function(value)
	{
		var val = this.value;
		if(val === null || val === undefined) val = '';
		val = this.prefix + val + this.suffix;
		this.element.textContent = val;
	}
});

if(typeof document === 'object' && document !== null)
{
	if(!('textContent' in document.documentElement))
	{
		TextBinder.prototype.refresh = function(value)
		{
			var val = this.value;
			if(val === null || val === undefined) val = '';
			val = this.prefix + val + this.suffix;
			this.element.innerText = val;
		};
	}
}

View.registerBinder('text', TextBinder);

module.exports = TextBinder;
