// if(typeof require === 'function') var kff = require('../build/kff.js');

// describe('kff.ClickBinder', function()
// {
// 	it('should bind click binder', function(done)
// 	{
// 		var $div = $('<div data-kff-bind="myModel.name:click(Petr)"/>');
// 		var view = new kff.BindingView(
// 		{
// 			element: $div,
// 			scope: {
// 				myModel: new kff.Model({
// 					name: 'Karel'
// 				})
// 			}
// 		});
// 		view.init();

// 		expect(view.getModel('myModel').get('name')).to.equal('Karel');

// 		$div.trigger('click');
// 		setTimeout(function()
// 		{
// 			expect(view.getModel('myModel').get('name')).to.equal('Petr');
// 			done();
// 		}, 0);
// 	});


// });
