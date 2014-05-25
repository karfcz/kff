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

});
