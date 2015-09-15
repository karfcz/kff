if(typeof require === 'function') var kff = require('../build/kff.js');

describe('kff.IfBinder', function()
{
	it('should insert a DOM element through if binder', function()
	{
		var myModel = new kff.Cursor({
			name: false
		});

		var div = document.createElement('div');
		var innerDiv = document.createElement('div');
		innerDiv.setAttribute('data-kff-bind', 'myModel.name:if(Petr)');
		div.appendChild(innerDiv);

		var view = new kff.View(
		{
			element: div,
			scope: {
				myModel: myModel
			},
			env: {
				document: document,
				body: document.body
			}
		});
		view.renderAll();
		view.runAll();
		expect(innerDiv.parentNode).to.equal(null);
		myModel.setIn('name', 'Petr');
		view.refreshAll();
		expect(innerDiv.parentNode).to.equal(div);
	});

	it('should set a class through class binder using dynamic scope value lookup', function()
	{
		var myModel = new kff.Cursor({
			name: 'Karel',
			value: 'Petr'
		});

		var div = document.createElement('div');
		var innerDiv = document.createElement('div');
		innerDiv.setAttribute('data-kff-bind', 'myModel.name:if(@myModel.value)');
		div.appendChild(innerDiv);

		var view = new kff.View(
		{
			element: div,
			scope: {
				myModel: myModel
			},
			env: {
				document: document,
				body: document.body
			}
		});
		view.renderAll();
		view.runAll();
		expect(innerDiv.parentNode).to.equal(null);
		myModel.setIn('name', 'Petr');
		view.refreshAll();
		expect(innerDiv.parentNode).to.equal(div);
	});

	it('should insert a DOM element through ifnot binder', function()
	{
		var myModel = new kff.Cursor({
			name: false
		});

		var div = document.createElement('div');
		var innerDiv = document.createElement('div');
		innerDiv.setAttribute('data-kff-bind', 'myModel.name:ifnot(Petr)');
		div.appendChild(innerDiv);

		var view = new kff.View(
		{
			element: div,
			scope: {
				myModel: myModel
			},
			env: {
				document: document,
				body: document.body
			}
		});
		view.renderAll();
		view.runAll();
		expect(innerDiv.parentNode).to.equal(div);
		myModel.setIn('name', 'Petr');
		view.refreshAll();
		expect(innerDiv.parentNode).to.equal(null);
	});

});