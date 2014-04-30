if(typeof require === 'function') var kff = require('../build/kff.js');


describe('kff.List', function()
{

	it('should append two values to the list', function()
	{
		var list = new kff.List();
		list.append('A');
		list.append('B');
		expect(list.count()).to.equal(2);
	});

	it('should append two values then remove last one from the list', function()
	{
		var list = new kff.List();
		list.append('A');
		list.append('B');
		list.remove('B');
		expect(list.count()).to.equal(1);
	});

	it('should append two values then remove first one from the list', function()
	{
		var list = new kff.List();
		list.append('A');
		list.append('B');
		list.remove('A');
		expect(list.count()).to.equal(1);
		expect(list.indexOf('B')).to.equal(0);
	});

	it('should append two values to the list then remove both', function()
	{
		var list = new kff.List();
		list.append('A');
		list.append('B');
		list.remove('A');
		list.remove('B');
		expect(list.count()).to.equal(0);
	});

	it('should insert one value to the list', function()
	{
		var list = new kff.List();
		list.append('A');
		list.append('C');
		list.insert('B', 1);

		expect(list.count()).to.equal(3);
		expect(list.get(1)).to.equal('B');
	});

	it('should get value from the list', function()
	{
		var list = new kff.List();
		list.append('A');
		expect(list.get(0)).to.equal('A');
	});

	it('should set value in the list', function()
	{
		var list = new kff.List();
		list.append('A');
		list.set(0, 'B');
		expect(list.get(0)).to.equal('B');
		expect(list.count()).to.equal(1);
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
			expect(list.count()).to.equal(0);
			done();
		}
	});

	it('should empty the list', function()
	{
		var list = new kff.List();
		list.append('A');
		list.empty();
		expect(list.count()).to.equal(0);
	});

	it('should iterate for each item in the list', function()
	{
		var list = new kff.List();
		var count = 0;
		list.append('A');
		list.append('B');
		list.each(function(item, i){
			count++;
			if(i === 0) expect(item).to.equal('A');
			if(i === 1) expect(item).to.equal('B');
		});
		expect(count).to.equal(2);
	});

	it('should filter out one item from the list', function()
	{
		var list = new kff.List();
		list.append('A');
		list.append('B');
		list.append('C');
		list.filter(function(item){
			return item !== 'A';
		});
		expect(list.count()).to.equal(2);
		expect(list.indexOf('B')).to.equal(0);
		expect(list.indexOf('C')).to.equal(1);
	});

});
