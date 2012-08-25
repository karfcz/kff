/**
 *  KFF Javascript microframework
 *  Copyright (c) 2008-2012 Karel Fučík
 *  Released under the MIT license.
 *  http://www.opensource.org/licenses/mit-license.php
 */

(function(scope)
{
	var kff;

	if(typeof exports !== 'undefined') kff = exports;
	else kff = (scope.kff = scope.kff || {});


	kff.FrontController = kff.createClass(
	{
		constructor: function() 
		{
			this.controller = null;
			this.controllerQueue = [];
		},

		init: function()
		{

		},

		createControllerFromState: function(state)
		{
			return state;
		},

		getLastController: function()
		{
			if(this.controllerQueue.length > 0) return this.controllerQueue[this.controllerQueue.length - 1];
			else return null;
		},

		pushController: function(controller)
		{
			var lastController = this.getLastController();
			this.controllerQueue.push(controller);
			lastController.initObserver.subscribe(kff.bindFn(controller, 'init'));
			lastController.setStateObserver.subscribe(kff.bindFn(controller, 'setState'));
			controller.destroyObserver.subscribe(kff.bindFn(this, 'destroyed'));
		},

		popController: function()
		{
			if(this.controllerQueue.length == 0) return;

			var removedController = this.controllerQueue.pop();
			var lastController = this.getLastController();

			removedController.initObserver.unsubscribe(kff.bindFn(this, 'cascadeState'));
			lastController.initObserver.unsubscribe(kff.bindFn(removedController, 'init'));
			lastController.setStateObserver.unsubscribe(kff.bindFn(removedController, 'setState'));
			return removedController;
		},

		cascadeState: function()
		{
			if(this.controllerQueue[0])
			{
				this.controllerQueue[0].setState(this.state);
			}
		},

		setState: function(state)
		{
			this.newControllerConstructor = this.createControllerFromState(state);
			var jointControllerConstructor = this.findJointController(this.newControllerConstructor, this.getLastController().constructor);
			var destroyQueue = [];

			do 
			{
				if(this.getLastController().constructor === jointControllerConstructor) break;
				destroyQueue.push(this.popController());
			} while(this.getLastController());

			for(var i = 0; i < destroyQueue.length; i++)
			{
				if(destroyQueue[i + 1])
				{
					destroyQueue[i].destroyObserver.subscribe(kff.bindFn(destroyQueue[i + 1], 'destroy'));
				}
				else
				{
					destroyQueue[i].destroyObserver.subscribe(kff.bindFn(this, 'startInit'));
				}
			};

			if(destroyQueue[0]) destroyQueue[0].destroy();
			else this.startInit();
		},

		startInit: function()
		{
			var superControllerConstructors = this.getSuperControllerConstructors(this.newControllerConstructor);
			for(var i = 0; i < superControllerConstructors.length; i++)
			{
				if(i >= this.controllerQueue.length) this.pushController(new superControllerConstructors[i](this));
			};

			this.newControllerConstructor = null;

			if(this.getLastController())
			{
				this.getLastController().initObserver.subscribe(kff.bindFn(this, 'cascadeState'));
			}

			if(this.controllerQueue[0])
			{
				this.controllerQueue[0].init();
			}
		},

		findJointController: function(c1, c2)
		{
			var c1a = this.getSuperControllerConstructors(c1);
			var c2a = this.getSuperControllerConstructors(c2);
			var c = null;
			for(var i = 0, l = c1a.length < c2a.length ? c1a.length : c2a.length; i < l; i++)
			{
				if(c1a[i] != c2a[i]) break;
				c = c1a[i];
			}
			
			return c;
		},

		getSuperControllerConstructors: function(controllerConstructor)
		{
			var c = controllerConstructor;
			var a = [];
			while(c)
			{
				a.unshift(c);
				c = c.superControllerConstructor || null;
			}	
			return a;
		}

	});


	/**
	 *	Controller
	 */ 
	kff.Controller = kff.createClass(
	{
		staticProperties: 
		{
			superControllerContructor: null
		}
	},
	{
		constructor: function(frontController)
		{
			this.frontController = frontController;
			this.initialized = false;
			this.initObserver = new kff.Observer();
			this.destroyObserver = new kff.Observer();
			this.setStateObserver = new kff.Observer();
		},

		

		init: function()
		{

		},
			
		destroy: function()
		{

		},

		setState: function(state)
		{

		}

	});

	
})(this);
