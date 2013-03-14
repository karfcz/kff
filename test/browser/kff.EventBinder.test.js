if(typeof require === 'function') var kff = require('../build/kff-all.js');

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
		view.getModel('myModel').get('name').should.equal('Karel');
		$div.trigger('mouseenter');
		setTimeout(function()
		{
			view.getModel('myModel').get('name').should.equal('Petr');
			view.getModel('myModel').set('name', 'Honza');
			view.getModel('myModel').get('name').should.equal('Honza');
			$div.trigger('myevent');
			setTimeout(function(){
				view.getModel('myModel').get('name').should.equal('Petr');
				done();
			}, 0);
		}, 0);
	});


});
