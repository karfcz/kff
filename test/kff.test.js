if(typeof require === 'function') var kff = require('../build/kff.js');

describe('kff.extends', function()
{
	it('should create a class constructor that extends another class', function()
	{
		var A = function(){};
		var B = function(){};
		kff.extend(B, A);

		var objB = new B;

		expect(objB instanceof A).to.be.true;
		expect(objB instanceof B).to.be.true;
	});
});

describe('kff.mixins', function()
{
	it('should mixin properties from one object', function()
	{
		var a = { prop1: 'prop1' };
		var b = { prop2: 'prop2' };
		var ret;

		ret = kff.mixins(b, a);

		expect(b).to.have.property('prop1');
		expect(b).to.have.property('prop2');
		expect(b.prop1).to.equal('prop1');
		expect(b).to.equal(ret);
	});

	it('should deep mixin object property that does not exist in original object', function()
	{
		var a = {  };
		var b = { prop2: { prop3: 'prop3' } };

		kff.deepMixins(a, b);

		expect(a).to.have.property('prop2');
		expect(a.prop2).to.have.property('prop3');
		expect(b.prop2.prop3).to.equal('prop3');
	});

	it('should mixin properties from multiple objects', function()
	{
		var a = { prop1: 'prop1' };
		var b = { prop2: 'prop2', prop3: 'prop3' };
		var c = { prop3: 'prop3c', prop4: 'prop4' };

		kff.mixins(a, b, c);

		expect(a).to.have.property('prop1');
		expect(a).to.have.property('prop2');
		expect(a).to.have.property('prop3');
		expect(a).to.have.property('prop4');
		expect(a.prop3).to.equal('prop3c');
		expect(a.prop4).to.equal('prop4');
	});

	it('should mixin properties from one objects using deep flag', function()
	{
		var a = { prop1: 'prop1', prop3: { prop4: 'prop4' }};
		var b = { prop2: 'prop2', prop3: { prop4: 'prop4b', prop5: 'prop5b' } };
		var ret;

		ret = kff.deepMixins(a, b);

		expect(a).to.have.property('prop1');
		expect(a).to.have.property('prop2');
		expect(a).to.have.property('prop3');

		expect(a.prop2).to.equal('prop2');
		expect(a.prop3.prop4).to.equal('prop4b');
		expect(a.prop3.prop5).to.equal('prop5b');
	});

	it('should deep mixin property with null value in extended object', function()
	{
		var a = { prop1: { prop2: null }};
		var b = { prop1: { prop2: 'prop2', prop3: 'prop3' } };
		var ret;

		ret = kff.deepMixins(a, b);

		expect(a).to.have.property('prop1');
		expect(a.prop1.prop2).to.equal('prop2');
		expect(a.prop1.prop3).to.equal('prop3');
	});

	it('should deep mixin property with null value in extending object', function()
	{
		var a = { prop1: { prop2: 'prop2' }};
		var b = { prop1: { prop2: null, prop3: 'prop3' } };
		var ret;

		ret = kff.deepMixins(a, b);

		expect(a).to.have.property('prop1');
		expect(a.prop1.prop2).to.be.null;
		expect(a.prop1.prop3).to.equal('prop3');
	});
});

describe('kff.createClass', function()
{
	var A = kff.createClass(
	{
		mixins: {
			m1: 15,
			m2: 'test'
		}
	},
	{
		constructor: function()
		{
			this.a = 42;
		},

		getA: function()
		{
			return this.a;
		}
	});
	var objA = new A();

	it('should create a class with mixins', function()
	{
		expect(objA instanceof A).to.equal(true);
		expect(objA.a).to.equal(42);
		expect(objA.m1).to.equal(15);
		expect(objA.m2).to.equal('test');
	});

	it('should create a class with mixins and extends', function()
	{
		var B = kff.createClass({
			extend: A,
			mixins: {
				m3: 'm3'
			}
		},{
			constructor: function()
			{
				this.constructor._super.constructor.call(this);
			}
		});

		var objB = new B();

		expect(objB instanceof A).to.equal(true);
		expect(objB instanceof B).to.equal(true);

		expect(objB.a).to.equal(42);
		expect(objB.getA()).to.equal(42);
		expect(objB.m1).to.equal(15);
		expect(objB.m2).to.equal('test');
		expect(objB.m3).to.equal('m3');
	});

});



describe('kff.isPlainObject', function()
{
	it('should return true for {}', function()
	{
		expect(kff.isPlainObject({})).to.be.true;
	});

	it('should return true for new Object', function()
	{
		expect(kff.isPlainObject(new Object())).to.be.true;
	});

	it('should return false for a string', function()
	{
		expect(kff.isPlainObject('test')).to.be.false;
	});

	it('should return false for a String wrapper', function()
	{
		expect(kff.isPlainObject(new String('test'))).to.be.false;
	});

	it('should return false for a number', function()
	{
		expect(kff.isPlainObject(42)).to.be.false;
	});

	it('should return false for null', function()
	{
		expect(kff.isPlainObject(null)).to.be.false;
	});

	it('should return false for undefined', function()
	{
		expect(kff.isPlainObject()).to.be.false;
	});

	it('should return false for true', function()
	{
		expect(kff.isPlainObject(true)).to.be.false;
	});

	it('should return false for false', function()
	{
		expect(kff.isPlainObject(false)).to.be.false;
	});

	it('should return false for a function', function()
	{
		expect(kff.isPlainObject(function(){})).to.be.false;
	});

	it('should return false for a window object', function()
	{
		expect(kff.isPlainObject(window)).to.be.false;
	});

	it('should return false for a document object', function()
	{
		expect(kff.isPlainObject(document)).to.be.false;
	});

	it('should return false for a DOM node', function()
	{
		expect(kff.isPlainObject($('<div/>').get(0))).to.be.false;
	});

	it('should return false for a jQuery object', function()
	{
		expect(kff.isPlainObject($('<div/>'))).to.be.false;
	});

	it('should return false for a Date object', function()
	{
		expect(kff.isPlainObject(new Date())).to.be.false;
	});

	it('should return false for an Array', function()
	{
		expect(kff.isPlainObject([1, 2])).to.be.false;
	});

	it('should return false for an Array constructed via new', function()
	{
		expect(kff.isPlainObject(new Array())).to.be.false;
	});

});

