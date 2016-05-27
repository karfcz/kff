
if(typeof require === 'function') var kff = require('../build/kff.js');

describe('kff.Dispatcher', function()
{
	it('should register an action', function()
	{
		var dispatcher = new kff.Dispatcher();
		expect(dispatcher.hasAction('test')).to.equal(false);
		dispatcher.registerActions({
			test: event => null
		});
		expect(dispatcher.hasAction('test')).to.equal(true);
	});

	it('should call an "on" registered callback', function()
	{
		var called = false;
		var dispatcher = new kff.Dispatcher();
		dispatcher.on('test', event => called = true);
		dispatcher.trigger({ type: 'test' });
		expect(called).to.equal(true);
	});

	it('should not call an "off" unregistered callback', function()
	{
		var called = false;
		var dispatcher = new kff.Dispatcher();
		var fn = event => called = true;
		dispatcher.on('test', fn);
		dispatcher.off('test', fn);
		dispatcher.trigger({ type: 'test' });
		expect(called).to.equal(false);
	});

	it('should bind event handler that catches triggered event', function(done)
	{
		var dispatcher = new kff.Dispatcher({
			test: event => done()
		});
		dispatcher.trigger({ type: 'test' });
	});

	it('should process a promise based event', function(done)
	{
		var dispatcher = new kff.Dispatcher({
			done: event => done(),
			promiseAction: event => new Promise((resolve, reject) => setTimeout(() => resolve({ type: 'done' }), 0))
		});
		dispatcher.trigger({ type: 'promiseAction' });
	});

});
