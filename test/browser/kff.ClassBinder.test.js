if(typeof require === 'function') var kff = require('../build/kff.js');

describe('kff.ClassBinder', function()
{
	it('should set a class through class binder', function()
	{
		var myModel = new kff.Cursor({
			name: 'Karel'
		});

		var div = document.createElement('div');
		div.setAttribute('data-kff-bind', 'myModel.name:class(myClass, Petr)');
		var view = new kff.View(
		{
			element: div,
			scope: {
				myModel: myModel
			}
		});
		view.renderAll();
		view.runAll();
		expect(div.classList.contains('myClass')).to.equal(false);
		myModel.setIn('name', 'Petr');
		view.refreshAll();
		expect(div.classList.contains('myClass')).to.equal(true);
	});

	it('should set a class through class binder using dynamic scope value lookup', function()
	{
		var myModel = new kff.Cursor({
			name: 'Karel',
			value: 'Petr'
		});

		var div = document.createElement('div');
		div.setAttribute('data-kff-bind', 'myModel.name:class(myClass, @myModel.value)');

		var view = new kff.View(
		{
			element: div,
			scope: {
				myModel: myModel
			}
		});
		view.renderAll();
		view.runAll();
		expect(div.classList.contains('myClass')).to.equal(false);
		myModel.setIn('name', 'Petr');
		view.refreshAll();
		expect(div.classList.contains('myClass')).to.equal(true);
	});

	it('should set a class through classnot binder', function()
	{
		var myModel = new kff.Cursor({
			name: 'Karel'
		});

		var div = document.createElement('div');
		div.setAttribute('data-kff-bind', 'myModel.name:classnot(myClass, Petr)');

		var view = new kff.View(
		{
			element: div,
			scope: {
				myModel: myModel
			}
		});
		view.renderAll();
		view.runAll();
		expect(div.classList.contains('myClass')).to.equal(true);
		myModel.setIn('name', 'Petr');
		view.refreshAll();
		expect(div.classList.contains('myClass')).to.equal(false);
	});

});