if(typeof require === 'function') var kff = require('../build/kff.js');

describe('kff.DisabledBinder', function()
{
	it('should bind disabled binder', function()
	{
		var state = new kff.Cursor(true);

		var input = document.createElement('input');
		input.setAttribute('type', 'text');
		input.setAttribute('data-kff-bind', 'state:disabled');

		var view = new kff.View(
		{
			element: input,
			scope: {
				state: state
			}
		});
		view.initAll();

		expect(input.disabled).to.equal(true);
		state.set(false);
		view.refreshAll();
		expect(input.disabled).to.equal(false);

	});


	it('should bind disabled binder to non-boolean state', function()
	{
		var disabledValue = 'disabledValue';
		var state = new kff.Cursor(disabledValue);

		var input = document.createElement('input');
		input.setAttribute('type', 'text');
		input.setAttribute('data-kff-bind', 'state:disabled(disabledValue)');

		var view = new kff.View(
		{
			element: input,
			scope: {
				state: state
			},
		});
		view.initAll();

		expect(input.disabled).to.equal(true);
		state.set('undisabledValue');
		view.refreshAll();

		expect(input.disabled).to.equal(false);
	});

});
