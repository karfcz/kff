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

});
