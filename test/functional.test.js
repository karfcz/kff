
if(typeof require === 'function') var kff = require('../dist/kff-cjs.js');

describe('kff.Cursor', function()
{

	it('should create a simple cursor from an object', function()
	{
		var o = { a: 42 };
		var cursor = new kff.Cursor(o, ['a']);
		expect(cursor.get()).to.equal(42);
	});

	it('should create a simple cursor from a nested object', function()
	{
		var o = {
			a: 5,
			b: {
				c: 42
			}
		};
		var cursorA = new kff.Cursor(o, ['a']);
		var cursorBC = new kff.Cursor(o, ['b', 'c']);
		expect(cursorA.get()).to.equal(5);
		expect(cursorBC.get()).to.equal(42);
	});

	it('should create a simple cursor from a nested object/array', function()
	{
		var o = {
			a: 5,
			b: {
				c: [0, 42, 0]
			}
		};
		var cursor = new kff.Cursor(o, ['b', 'c', 1]);
		expect(cursor.get()).to.equal(42);
	});

	it('should set value in cursor', function()
	{
		var o = {
			a: 5,
			b: {
				c: 42
			}
		};
		var cursorBC = new kff.Cursor(o, ['b', 'c']);
		var b = o.b;
		cursorBC.set(43);
		expect(cursorBC.get()).to.equal(43);
		expect(cursorBC.get()).to.not.equal(o.b.c);
		expect(b).to.equal(o.b);
	});

	it('should update value in cursor', function()
	{
		var o = {
			a: 5,
			b: {
				c: 42
			}
		};

		var inc = function(val){ return val + 1; };
		var cursorBC = new kff.Cursor(o, ['b', 'c']);
		var b = o.b;
		cursorBC.update(inc);
		expect(cursorBC.get()).to.equal(43);
		expect(cursorBC.get()).to.not.equal(o.b.c);
		expect(b).to.equal(o.b);
	});

	it('should update value in cursor with array', function()
	{
		var o = {
			a: 5,
			b: {
				c: [0, 42, 0]
			}
		};

		var inc = function(val){ return val + 1; };
		var cursor = new kff.Cursor(o, ['b', 'c', 1]);
		var b = o.b;
		cursor.update(inc);
		expect(cursor.get()).to.equal(43);
		expect(cursor.get()).to.not.equal(o.b.c[1]);
	});

	it('should refine a cursor', function()
	{
		var o = {
			a: 5,
			b: {
				c: 42
			}
		};

		var inc = function(val){ return val + 1; };
		var cursor1 = new kff.Cursor(o, ['b']);
		var cursor2 = cursor1.refine(['c']);
		expect(cursor2.get()).to.equal(42);
	});

});
