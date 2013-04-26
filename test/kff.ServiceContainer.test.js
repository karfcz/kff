if(typeof require === 'function') var kff = require('../build/kff-all.js');

describe('kff.ServiceContainer', function()
{
	var Service1 = function(a, b){ this.a = a; this.b = b; };
	var Service2 = function(a, b){ this.a = a; this.b = b; };

	var config = {
		parameters:
		{
			kocka: 'kočka',
			pes: 'pes',
			numeric: 42.05,
			obj: { o1: 1, o2: 2 }
		},
		services:
		{
			'service1':
			{
				'construct': Service1,
			    'args': ['%kocka%', 'haf']
			},
			'service2':
			{
				'construct': Service2,
			    'args': ['@service1', 'Proč %kocka% není %pes%?'],
			    'shared': true
			},
			'service3':
			{
				'construct': Service1,
			    'args': ['%kocka%', '%obj%']
			}
		}
	};

	//console.log(kff.evalObjectPath('this'));

	var container = new kff.ServiceContainer(config);

	describe('#resolveParameters', function()
	{
		it('should interpolate plain string as the string itself', function()
		{
			container.resolveParameters('This is a plain string').should.equal('This is a plain string');
		});

		it('should interpolate string with two parameters', function()
		{
			container.resolveParameters('Proč %kocka% není %pes%?').should.equal('Proč kočka není pes?');
		});

		it('should interpolate string with referece to a service', function()
		{
			container.resolveParameters('@service1').should.be.an.instanceof(Service1);
		});

		it('should interpolate object with refereces to parameters and services', function()
		{
			var a = container.resolveParameters({ x: '@service1', y: { z: 'Proč %kocka% není %pes%?' }});
			a.should.have.keys('x', 'y');
			a.x.should.be.an.instanceof(Service1);
			a.y.should.have.property('z', 'Proč kočka není pes?');
		});

		it('should interpolate array with refereces to parameters and services', function()
		{
			var a = container.resolveParameters([ '@service1', { z: 'Proč %kocka% není %pes%?' }]);
			a[0].should.be.an.instanceof(Service1);
			a[1].should.have.property('z', 'Proč kočka není pes?');
		});

		it('should interpolate referece to container itself', function()
		{
			var a = container.resolveParameters({ x: '@' });
			a.should.have.property('x');
			a.x.should.equal(container);
		});

		it('should interpolate parameter with single % character', function()
		{
			var a = container.resolveParameters('Proč %kocka% není %pes?');
			a.should.equal('Proč kočka není %pes?');
		});

		it('should interpolate parameter with escaped %% character', function()
		{
			var a = container.resolveParameters('Proč %kocka% není %%pes, ale %kocka%?');
			a.should.equal('Proč kočka není %pes, ale kočka?');
		});

		it('should return cached interpolated parameter', function()
		{
			var a = container.resolveParameters('Proč %kocka% není %%pes, ale %kocka%?');
			a.should.equal('Proč kočka není %pes, ale kočka?');
			a = container.resolveParameters('Proč %kocka% není %%pes, ale %kocka%?');
			a.should.equal('Proč kočka není %pes, ale kočka?');
		});

		it('should interpolate single numeric parameter', function()
		{
			var a = container.resolveParameters('%numeric%');
			a.should.equal(42.05);
		});

	});

	describe('#createService', function()
	{
		it('should create service of type Service1', function()
		{
			container.createService('service1').should.be.an.instanceof(Service1);
		});

		it('should create service of type Service1 that have property a === kočka', function()
		{
			container.createService('service1').should.have.property('a', 'kočka');
		});

		it('should create service with overloaded arguments', function()
		{
			var service3 = container.createService('service3', [undefined, { o2: 3 }]);
			service3.should.have.property('a', 'kočka');
			service3.should.have.property('b');
			service3.b.should.have.property('o1', 1);
			service3.b.should.have.property('o2', 3);
		});

	});

	describe('#getService', function()
	{
		it('should return a service with another service as a constructor argument', function()
		{
			var a = container.getService('service2');
			a.should.be.an.instanceof(Service2);
			a.should.have.keys('a', 'b');
			a.a.should.be.an.instanceof(Service1);
			a.should.have.property('b', 'Proč kočka není pes?');
		});

		it('should create two different instances of service', function()
		{
			var a = container.getService('service1');
			var b = container.getService('service1');
			a.should.not.equal(b);
		});

		it('should return the same instances of shared service', function()
		{
			var a = container.getService('service2');
			var b = container.getService('service2');
			a.should.equal(b);
		});
	});

	describe('#hasService', function()
	{
		it('should return false', function()
		{
			container.hasService('undefinedService').should.be.false;
		});

		it('should return true', function()
		{
			container.hasService('service1').should.be.true;
		});

	});

	describe('#registerService', function()
	{
		it('should properly register a new service', function()
		{
			container.registerServices({
				'service4': {
					'construct': function() {
						this.a = 'service 4';
					}
				}
			});

			var ret = container.getService('service4');
			ret.should.have.property('a', 'service 4');
		});
	});

});
