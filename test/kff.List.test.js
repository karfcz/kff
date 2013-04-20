if(typeof require === 'function') var kff = require('../build/kff-all.js');


describe('kff.List', function()
{

	it('should append two values to the list', function()
	{
		var list = new kff.List();
		list.append('A');
		list.append('B');
		list.count().should.equal(2);
	});

	it('should append two values then remove last one from the list', function()
	{
		var list = new kff.List();
		list.append('A');
		list.append('B');
		list.remove('B');
		list.count().should.eql(1);
	});

	it('should append two values then remove first one from the list', function()
	{
		var list = new kff.List();
		list.append('A');
		list.append('B');
		list.remove('A');
		list.count().should.eql(1);
		list.indexOf('B').should.eql(0);
	});

	it('should append two values to the list then remove both', function()
	{
		var list = new kff.List();
		list.append('A');
		list.append('B');
		list.remove('A');
		list.remove('B');
		list.count().should.eql(0);
	});

	it('should insert one value to the list', function()
	{
		var list = new kff.List();
		list.append('A');
		list.append('C');
		list.insert('B', 1);

		list.count().should.eql(3);
		list.get(1).should.equal('B');
	});

	it('should get value from the list', function()
	{
		var list = new kff.List();
		list.append('A');
		list.get(0).should.equal('A');
	});

	it('should set value in the list', function()
	{
		var list = new kff.List();
		list.append('A');
		list.set(0, 'B');
		list.get(0).should.equal('B');
		list.count().should.equal(1);
	});

	it('should not set value on nonexistent index in the list', function(done)
	{
		var list = new kff.List();
		try
		{
			list.set(42, 'B');
		}
		catch (error)
		{
			list.count().should.equal(0);
			done();
		}
	});

	it('should empty the list', function()
	{
		var list = new kff.List();
		list.append('A');
		list.empty();
		list.count().should.equal(0);
	});

	it('should iterate for each item in the list', function()
	{
		var list = new kff.List();
		var count = 0;
		list.append('A');
		list.append('B');
		list.each(function(item, i){
			count++;
			if(i === 0) item.should.equal('A');
			if(i === 1) item.should.equal('B');
		});
		count.should.equal(2);
	});

});
