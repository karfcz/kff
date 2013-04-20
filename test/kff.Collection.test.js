// var should = require('should');

if(typeof require === 'function') var kff = require('../build/kff-all.js');

describe('kff.Collection', function()
{
	var cls = new kff.Collection();
	var obj1 = new kff.Model();

	it('should contain one item', function()
	{
		cls.append(obj1);
		cls.count().should.equal(1);
	});

});
