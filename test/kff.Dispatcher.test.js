
if(typeof require === 'function') var kff = require('../build/kff.js');

describe('kff.Dispatcher', function()
{

	it('should bind event handler that catches triggered event', function(done)
	{
		var dispatcher = new kff.Dispatcher({
				test: function(event){
					done();
				}
		});

		dispatcher.trigger({ name: 'test' });



	});


});
