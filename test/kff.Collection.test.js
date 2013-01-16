var should = require('should');
var kff = require('../kff-all.js');

describe('kff.Collection', function()
{
	var cls = new kff.Collection();
	var obj1 = new kff.Model();

	it('should contain one item', function()
	{
		cls.append(obj1);
		cls.count.should.equal(1);
	});
	
});
