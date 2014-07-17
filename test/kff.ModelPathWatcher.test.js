if(typeof require === 'function') var kff = require('../build/kff.js');

describe('kff.ModelPathWatcher', function()
{

	it('should watch model path', function(done)
	{
		var m1 = new kff.Model({
			a: 1
		});
		var m2 = new kff.Model({
			a: 2
		});
		var m = new kff.Model({
			m1: m1
		});
		var watcher = new kff.ModelPathWatcher(m, 'm1.a');
		watcher.init();
		watcher.on('change:a', function(){
			done();
		});

		m.set('m1', m2);
	});


});
