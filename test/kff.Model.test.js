if(typeof require === 'function') var kff = require('../build/kff-all.js');

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


	describe('#mget', function()
	{
		var obj = new kff.Model();
		var obj2 = new kff.Model();
		obj.set('obj2', obj2);
		obj2.set('prop', 'prop');

		it('should deep get property "obj.obj2.prop" with value "prop"', function()
		{
			obj.mget('obj2.prop').should.equal('prop');
		});

	});


});
