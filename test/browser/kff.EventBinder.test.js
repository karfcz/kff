if(typeof require === 'function') var kff = require('../build/kff.js');

describe('kff.EventBinder', function()
{
	it('should bind event binder', function(done)
	{
		var $div = $('<div data-kff-bind="myModel.name:event(Petr):on(myevent, mouseenter)"/>');
		var view = new kff.BindingView(
		{
			element: $div,
			models: {
				myModel: new kff.Model({
					name: 'Karel'
				})
			}
		});
		view.init();
		expect(view.getModel('myModel').get('name')).to.equal('Karel');
		$div.trigger('mouseenter');
		setTimeout(function()
		{
			expect(view.getModel('myModel').get('name')).to.equal('Petr');
			view.getModel('myModel').set('name', 'Honza');
			expect(view.getModel('myModel').get('name')).to.equal('Honza');
			$div.trigger('myevent');
			setTimeout(function(){
				expect(view.getModel('myModel').get('name')).to.equal('Petr');
				done();
			}, 0);
		}, 0);
	});


});
