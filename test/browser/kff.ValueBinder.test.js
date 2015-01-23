// if(typeof require === 'function') var kff = require('../build/kff.js');

// describe('kff.BindingView', function()
// {
// 	it('should bind input binder', function(done)
// 	{
// 		var $input = $('<input data-kff-bind="myModel.name:val"/>');
// 		var view = new kff.BindingView(
// 		{
// 			element: $input,
// 			models: {
// 				myModel: new kff.Model({
// 					name: 'Karel'
// 				})
// 			}
// 		});
// 		view.init();
// 		setTimeout(function()
// 		{
// 			expect($input.val()).to.equal('Karel');
// 			view.getModel('myModel').set('name', 'Petr');
// 			expect($input.val()).to.equal('Petr');
// 			$input.val('Honza').trigger('change');
// 			setTimeout(function()
// 			{
// 				expect(view.getModel('myModel').get('name')).to.equal('Honza');
// 				done();
// 			}, 0);
// 		}, 0);
// 	});


// });
