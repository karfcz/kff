if(typeof require === 'function') var kff = require('../build/kff-all.js');

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

		ret.should.have.property('target');
		ret.target.should.equal(1);
		ret.params.should.have.property('id');
		ret.params.id.should.equal('42');
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

		ret.should.have.property('target');
		ret.target.should.equal(2);
		ret.params.should.have.property('name');
		ret.params.name.should.equal('john');
		ret.params.should.have.property('id');
		ret.params.id.should.equal('42');
	});


});
