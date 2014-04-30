if(typeof require === 'function') var kff = require('../build/kff.js');

describe('kff.Router', function()
{
	it('should match a simple route', function()
	{
		var router = new kff.Router(
		{
			routes: {
				'user/:id': 1,
				'user/:name/:id': 2
			}
		});

		var ret = router.match('user/42');

		expect(ret).to.have.property('target', 1);
		expect(ret.params).to.have.property('id', '42');
	});

	it('should match second route', function()
	{
		var router = new kff.Router(
		{
			routes: {
				'user/:id': 1,
				'user/:name/:id': 2
			}
		});

		var ret = router.match('user/john/42');

		expect(ret).to.have.property('target', 2);
		expect(ret.params).to.have.property('name', 'john');
		expect(ret.params).to.have.property('id', '42');
	});


});
