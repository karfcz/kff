if(typeof require === 'function') var kff = require('../build/kff.js');

describe('kff.Route', function()
{
	it('should match a simple route', function()
	{
		var route = new kff.Route('user/:id', 'target');
		var params = {};
		route.match('user/42', params);
		expect(params).to.have.property('id', '42');
	});

	it('should not match a simple route', function()
	{
		var route = new kff.Route('user/:id', 'target');
		var params = {};
		var ret = route.match('nonsense/42', params);
		expect(ret).to.be.false;
	});

	it('should match a route with two params', function()
	{
		var route = new kff.Route('user/:name/:id', 'target');
		var params = {};
		route.match('user/john/42', params);
		expect(params).to.have.property('name', 'john');
		expect(params).to.have.property('id', '42');
	});

});
