if(typeof require === 'function') var kff = require('../dist/kff-cjs.js');

describe('kff.DisabledNotBinder', function()
{
	it('should bind disablednot binder', function()
	{
		var state = new kff.Cursor(false);

		var input = document.createElement('input');
		input.setAttribute('type', 'text');
		input.setAttribute('data-kff-bind', 'state:disablednot');

		var view = new kff.View(
		{
			element: input,
			scope: {
				state: state
			}
		});
		view.initAll();

		expect(input.disabled).to.equal(true);
		state.set(true);
		view.refreshAll();
		expect(input.disabled).to.equal(false);

	});


	it('should bind disablednot binder to non-boolean state', function()
	{
		var disabledValue = 'disabledValue';
		var state = new kff.Cursor(disabledValue);

		var input = document.createElement('input');
		input.setAttribute('type', 'text');
		input.setAttribute('data-kff-bind', 'state:disablednot(disabledValue)');

		var view = new kff.View(
		{
			element: input,
			scope: {
				state: state
			},
		});
		view.initAll();

		expect(input.disabled).to.equal(false);
		state.set('undisabledValue');
		view.refreshAll();

		expect(input.disabled).to.equal(true);
	});

});
