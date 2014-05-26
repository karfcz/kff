// var should = require('should');

if(typeof require === 'function') var kff = require('../build/kff.js');

describe('kff.Collection', function()
{
	var cls = new kff.Collection();
	var obj1 = new kff.Model();

	it('should contain one item', function()
	{
		cls.append(obj1);
		expect(cls.count()).to.equal(1);
	});

	it('should create a new filtered collection', function()
	{
		var m1 = new kff.Model({ a: 1 });
		var m2 = new kff.Model({ a: 2 });
		var m3 = new kff.Model({ a: 3 });

		var c1 = new kff.Collection();
		c1.append(m1);
		c1.append(m2);
		c1.append(m3);

		var c2 = c1.filter(function(item){
			return item.get('a') === 2;
		});

		expect(c2.count()).to.equal(1);
		expect(c2.get(0)).to.equal(m2);
	});

	it('should concat two collections', function()
	{
		var m1 = new kff.Model({ a: 1 });
		var m2 = new kff.Model({ a: 2 });
		var m3 = new kff.Model({ a: 3 });

		var c1 = new kff.Collection();
		c1.append(m1);
		c1.append(m2);

		var c2 = new kff.Collection();
		c2.append(m3);

		var c3 = c1.concat(c2);

		expect(c3.count()).to.equal(3);
		expect(c3.get(2)).to.equal(m3);
	});

	it('should concat collection and two models', function()
	{
		var m1 = new kff.Model({ a: 1 });
		var m2 = new kff.Model({ a: 2 });
		var m3 = new kff.Model({ a: 3 });

		var c1 = new kff.Collection();
		c1.append(m1);

		var c3 = c1.concat(m2, m3);

		expect(c3.count()).to.equal(3);
		expect(c3.get(2)).to.equal(m3);
	});

	it('should join collection', function()
	{
		var m1 = new kff.Model({ a: '1' });
		var m2 = new kff.Model({ a: '2' });

		m1.toString = m2.toString = function(){
			return this.get('a');
		};

		var out = new kff.Collection().concat(m1, m2).join(' ');

		expect(out).to.equal('1 2');
	});

	it('should map collection to another collection', function()
	{
		var m1 = new kff.Model({ a: 1 });
		var m2 = new kff.Model({ a: 2 });
		var m3 = new kff.Model({ a: 3 });

		var c1 = new kff.Collection();
		c1 = c1.concat(m1, m2, m3);

		var thisObj = {
			increment: 2
		};

		var i = 0;

		var c2 = c1.map(function(item, index, collection)
		{
			expect(this).to.equal(thisObj);
			expect(collection).to.equal(c1);
			expect(index).to.equal(i);

			i++;
			return new kff.Model({ a: item.get('a') + this.increment });

		}, thisObj);

		expect(c2.count()).to.equal(3);
		expect(c2.get(1).get('a')).to.equal(4);
	});

	it('should reduce collection', function()
	{
		var m1 = new kff.Model({ a: 1 });
		var m2 = new kff.Model({ a: 2 });
		var m3 = new kff.Model({ a: 3 });

		var c1 = new kff.Collection();
		c1 = c1.concat(m1, m2, m3);

		var sum = c1.reduce(function(prev, current)
		{
			return new kff.Model({ a: prev.get('a') +  current.get('a') });
		});

		expect(sum.get('a')).to.equal(6);
	});

	it('should reduce collection with initial value', function()
	{
		var m1 = new kff.Model({ a: 1 });
		var m2 = new kff.Model({ a: 2 });
		var m3 = new kff.Model({ a: 3 });

		var c1 = new kff.Collection();
		c1 = c1.concat(m1, m2, m3);

		var sum = c1.reduce(function(prev, current)
		{
			if(prev instanceof kff.Model) return prev.get('a') + current.get('a');
			else return prev + current.get('a');
		}, 10);

		expect(sum).to.equal(16);
	});

	it('should reduceRight collection with initial value', function()
	{
		var m1 = new kff.Model({ a: 1 });
		var m2 = new kff.Model({ a: 2 });
		var m3 = new kff.Model({ a: 3 });

		var c1 = new kff.Collection();
		c1 = c1.concat(m1, m2, m3);

		var sum = c1.reduceRight(function(prev, current)
		{
			if(prev instanceof kff.Model) return prev.get('a') - current.get('a');
			else return prev - current.get('a');
		}, 10);

		expect(sum).to.equal(4);
	});

});
