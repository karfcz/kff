
if(typeof require === 'function') var kff = require('../build/kff.js');

describe('kff.Cursor', function()
{

	it('should create a simple cursor from an object', function()
	{
		var o = { a: 42 };
		var cursor = new kff.Cursor(['a'], o);
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
		var cursorA = new kff.Cursor(['a'], o);
		var cursorBC = new kff.Cursor(['b', 'c'], o);
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
		var cursor = new kff.Cursor(['b', 'c', 1], o);
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
		var cursorBC = new kff.Cursor(['b', 'c'], o);
		var b = o.b;
		cursorBC.set(43);
		expect(cursorBC.get()).to.equal(43);
		expect(cursorBC.get()).to.equal(o.b.c);
		expect(b).to.not.equal(o.b);
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
		var cursorBC = new kff.Cursor(['b', 'c'], o);
		var b = o.b;
		cursorBC.update(inc);
		expect(cursorBC.get()).to.equal(43);
		expect(cursorBC.get()).to.equal(o.b.c);
		expect(b).to.not.equal(o.b);
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
		var cursor = new kff.Cursor(['b', 'c', 1], o);
		var b = o.b;
		cursor.update(inc);
		expect(cursor.get()).to.equal(43);
		expect(cursor.get()).to.equal(o.b.c[1]);
		expect(b).to.not.equal(o.b);
		expect(o.b.c[0]).to.equal(0);
		expect(o.b.c[1]).to.equal(43);
		expect(o.b.c[2]).to.equal(0);
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
		var cursor1 = new kff.Cursor(['b'], o);
		var cursor2 = cursor1.refine(['c']);
		expect(cursor2.get()).to.equal(42);
	});

});
