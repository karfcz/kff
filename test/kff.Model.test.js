if(typeof require === 'function') var kff = require('../build/kff.js');

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
		expect(obj.get('one')).to.equal('oneValue');
	});

	it('should have property "two" with value "twoValue"', function()
	{
		expect(obj.get('two')).to.equal('twoValue');
		expect(obj.get('three')).to.equal('threeValue');
	});


	describe('#mget', function()
	{
		var obj = new kff.Model();
		var obj2 = new kff.Model();
		obj.set('obj2', obj2);
		obj2.set('prop', 'prop');

		it('should deep get property "obj.obj2.prop" with value "prop"', function()
		{
			expect(obj.mget('obj2.prop')).to.equal('prop');
		});

	});


	describe('#set', function()
	{

		it('should trigger events for one property set', function(done)
		{
			var obj = new kff.Model();
			var count = 0;
			obj.on('change:a', function(event){
				if(event.changed.a === 42) count++;
			});
			obj.on('change', function(event){
				if(event.changed.a === 42) count++;
				if(count === 2) done();
			});
			obj.set('a', 42);
		});

		it('should trigger events for two property set', function(done)
		{
			var count = 0;
			obj.on('change:a', function(event){
				if(event.changed.a === 42) count++;
				if(event.changed.b === 43) count++;
			});
			obj.on('change', function(event){
				if(event.changed.a === 42 && event.changed.b === 43) count++;
				if(count === 3) done();
			});
			obj.set({
				a: 42,
				b: 43
			});
		});

	});

	describe('#unset', function()
	{

		it('should trigger events for one property unset', function(done)
		{
			var obj = new kff.Model({
				a: 1
			});
			var count = 0;
			obj.on('change:a', function(event){
				if(event.changed.a === undefined) count++;
			});
			obj.on('change', function(event){
				if(event.changed.a === undefined) count++;
				if(count === 2) done();
			});
			obj.unset('a');
		});

		it('should trigger events for two property unset', function(done)
		{
			var obj = new kff.Model({
				a: 1,
				b: 2
			});

			var count = 0;
			obj.on('change', function(event){
				if(event.changed.a === undefined && event.changed.b === undefined) done();
			});
			obj.unset(['a', 'b']);
		});

	});


	describe('#createComputed', function()
	{
		it('should create computed property', function(done)
		{
			var ComputedModel = kff.createClass({
				extend: kff.Model
			},
			{
				constructor: function()
				{
					kff.Model.call(this, {
						a: 1,
						b: 2
					});
					this.createComputed('c', ['a', 'b'], 'computeC');
				},

				computeC: function(a, b)
				{
					return a + b;
				}
			});
			var obj = new ComputedModel();

			expect(obj.get('c')).to.equal(3);

			obj.on('change:c', function(event){
				expect(obj.get('c')).to.equal(7);
				done();
			});

			obj.set({
				a: 3,
				b: 4
			});
		});

	});


	describe('#each', function()
	{
		it('should iterate over each model attribute', function()
		{
			var result = 0;
			var obj = new kff.Model({
				a: 1,
				b: 2,
				c: 3
			});

			obj.each(function(key, val)
			{
				result += val;
			});

			expect(result).to.equal(6);
		});
	});


	describe('#kff.createModelClass', function()
	{
		it('should create modelClass', function()
		{
			var M1 = kff.createModelClass({
				args: [{
					a: 1,
					b: 2
				}]
			}, {});

			var m1 = new M1({
				a: 1,
				b: 2
			});

			expect(m1.get('a')).to.equal(1);
			expect(m1.a()).to.equal(1);
			expect(m1.b()).to.equal(2);

			m1.a(42);
			expect(m1.get('a')).to.equal(42);
			expect(m1.a()).to.equal(42);
		});
	});


});
