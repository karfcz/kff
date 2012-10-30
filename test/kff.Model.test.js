var should = require('should');
var kff = require('../kff-all.js');

describe('kff.Model', function()
{
	var cls = kff.createClass({
		extend: kff.Model
	},
	{
		constructor: function()
		{
			this.constructor._super.constructor.call(this);
			//kff.Model.call(this);
			this.set('one', 'oneValue');
			this.set({
				two: 'twoValue',
				three: 'threeValue'
			});
		}
	});
	var obj = new cls();

	it('should have property "one" with value "oneValue"', function()
	{
		obj.get('one').should.equal('oneValue');
	});

	it('should have property "two" with value "twoValue"', function()
	{
		obj.get('two').should.equal('twoValue');
		obj.get('three').should.equal('threeValue');
	});
	
});
