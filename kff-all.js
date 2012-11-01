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

	kff.widgets = {};
	
	kff.extend = function(child, parent)
	{
		var F = function(){};
		child._super = F.prototype = parent.prototype;
		child.prototype = new F();
		child.prototype.constructor = child;
	};

	kff.mixins = function(obj, properties)
	{
		for(var key in properties) if(properties.hasOwnProperty(key)) obj[key] = properties[key];
	};

	kff.createClass = function(meta, properties)
	{
		var constructor;
		if(arguments.length === 0) meta = properties = {};
		else if(arguments.length === 1)
		{
			properties = meta;
			meta = {};
		}

		// Create a new constructor if not defined in properties
		if(properties.hasOwnProperty('constructor'))
		{
			constructor = properties.constructor;
		}
		else
		{
			if(meta.extend) constructor = function(){ meta.extend.apply(this, arguments); };
			else constructor = function(){};
		}
		
		// Extend from parent class
		if(meta.extend) kff.extend(constructor, meta.extend);

		// Concatenate properties from properties objects and mixin objects
		if(meta.mixins)
		{
			if(!(meta.mixins instanceof Array)) meta.mixins = [meta.mixins];
			for(var i = 0, l = meta.mixins.length; i < l; i++) kff.mixins(properties, meta.mixins[i]);
		}

		// Static properties of constructor
		if(meta.staticProperties)
		{
			kff.mixins(constructor, meta.staticProperties);
		}
		
		// Add properties to prototype
		kff.mixins(constructor.prototype, properties);

		// Set proper constructor
		constructor.prototype.constructor = constructor;

		return constructor;
	};

	kff.bindFn = function(obj, fnName)
	{
		if(typeof obj[fnName] !== 'function') throw new TypeError("expected function");
		if(!obj.boundFns) obj.boundFns = {};
		if(obj.boundFns[fnName]) return obj.boundFns[fnName];
		else obj.boundFns[fnName] = function(){ return obj[fnName].apply(obj, arguments); };
		return obj.boundFns[fnName];
	};

	kff.isTouchDevice = function()
	{
		return !!('ontouchstart' in window);
	};
	

	kff.evalObjectPath = function(path)
	{
		var obj = scope;
		var parts = path.split('.');
		while(parts.length)
		{
			if(!(parts[0] in obj)) return null;
			obj = obj[parts.shift()];
		}
		return obj;
	};


})(this);

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
	
	kff.LinkedList = kff.createClass(
	{
		constructor: function()	
		{
			this.tail = this.head = { next: null };
			this.count = 0;
		},
		
		each: function(fn)
		{
			var node = this.head.next;
			while(node)
			{
				fn.call(null, node.val);
				node = node.next;
			}
		},
		
		append: function(val)
		{
			var node = { val: val, next: null };
			this.tail.next = node;
			this.tail = node;
			this.count++;
		},
		
		removeVal: function(val)
		{
			var node = this.head.next, prev = this.head, ret = false;
			while(node)
			{
				if(node.val === val)
				{
					if(node.next) prev.next = node.next;
					else
					{
						prev.next = null;
						this.tail = prev;
					}
					this.count--;
					ret = true;
				}
				else prev = node;
				node = node.next;
			}
			return ret;
		}
	});

})(this);

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
	
	kff.Events = kff.createClass(
	{
		constructor: function()
		{
			this.subscribers = {};
		},

		on: function(eventType, fn)
		{
			this.off(eventType, fn);
			if(eventType instanceof Array)
			{
				for(var i = 0, l = eventType.length; i < l; i++)
				{
					if(eventType[i])
					{
						if(!this.subscribers[eventType[i]]) this.subscribers[eventType[i]] = [];
						this.subscribers[eventType[i]].push(fn);
					}
				}
			}
			else
			{
				if(!this.subscribers[eventType]) this.subscribers[eventType] = new kff.LinkedList();
				this.subscribers[eventType].append(fn);
			}
		},

		off: function(eventType, fn)
		{
			var i, l;
			if(eventType instanceof Array)
			{
				for(i = 0, l = eventType.length; i < l; i++)
				{
					if(eventType[i]) this.off(eventType[i], fn);
				}
			}
			else
			{
				if(this.subscribers[eventType] instanceof kff.LinkedList) this.subscribers[eventType].removeVal(fn);
			}
		},

		trigger: function(eventType, eventData)
		{
			var i, l;
			if(eventType instanceof Array)
			{
				for(i = 0, l = eventType.length; i < l; i++)
				{
					if(eventType[i]) this.trigger(eventType[i], eventData);
				}
			}
			else
			{
				if(this.subscribers[eventType] instanceof kff.LinkedList)
				{
					this.subscribers[eventType].each(function(val)
					{
						val.call(null, eventData);
					});
				}		
			}
		}
	});
	
	kff.EventsMixin = {
		on: function(eventType, fn){ return this.events.on(eventType, fn); },
		off: function(eventType, fn){ return this.events.off(eventType, fn); },
		trigger: function(eventType, eventData){ return this.events.trigger(eventType, eventData); }
	};



})(this);

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

	/**
	 *  kff.Model
	 *
	 */
	kff.Model = kff.createClass(
	{
		mixins: kff.EventsMixin
	},
	{
		constructor: function()
		{
			this.events = new kff.Events();
			this.attrs = {};
		},

		get: function(attr)
		{
			return this.attrs[attr];
		},

		set: function(attr, value, options)
		{
			var changed = {};

			if(typeof attr === 'string')
			{
				if(this.get(attr) === value) return;
				changed[attr] = value;
				if(typeof this.validate === 'function')
				{
					if(!this.validate(changed)) return;
				}
				this.attrs[attr] = value;
			} 
			else if(attr === Object(attr))
			{
				options = value;
				changed = attr;
				if(typeof this.validate === 'function')
				{
					if(!this.validate(changed)) return;
				}
				for(var key in changed) this.attrs[key] = changed[key];
			}
			this.trigger('change', { changedAttributes: changed });
		}

	});

})(this);

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

	/**
	 *  kff.ServiceContainer
	 *
	 */
	kff.ServiceContainer = kff.createClass(
	{
		constructor: function(config)
		{
			this.config = config || { parameters: {}, services: {} };
			this.services = {};
		},
		
		getService: function(service)
		{
			if(!this.config.services[service]) throw('Service ' + service + ' not defined');
			if(this.config.services[service].shared)
			{
				if(typeof this.services[service] === 'undefined') this.services[service] = this.createService(service);;
				return this.services[service];
			}
			return this.createService(service);
		},
		
		existsService: function(serviceName)
		{
			return this.config.services.hasOwnProperty(serviceName);
		},
		
		createService: function(serviceName)
		{
			var serviceConfig, Ctor, Temp, service, ret, i, l, calls;
			
			serviceConfig = this.config.services[serviceName];
			
			if(typeof serviceConfig.constructor !== 'function') serviceConfig.constructor = kff.evalObjectPath(serviceConfig.constructor);
			
			Ctor = serviceConfig.constructor;
			
			Temp = function(){};			
			Temp.prototype = Ctor.prototype;
			service = new Temp();
			ret = Ctor.apply(service, this.resolveParameters(serviceConfig.args));	
			if(Object(ret) === ret) service = ret;
			
			calls = serviceConfig.calls;
			if(calls instanceof Array)
			{
				for(i = 0, l = calls.length; i < l; i++)
				{
					service[calls[i].method].apply(service, this.resolveParameters(calls[i].args));
				}
			}
			return service;
		},
		
		resolveParameters: function(params)
		{
			var ret, i, l, config;
			
			config = this.config;
			
			if(typeof params === 'string')
			{
				if(params[0] === '@')
				{
					params = params.slice(1);
					if(params.length === 0) ret = this;
					else ret = this.getService(params);
				}
				else if(params.indexOf('%') !== -1)
				{
					params = params.replace(/%([^%]+)%/g, function(match, p1)
					{
						if(config.parameters[p1]) return config.parameters[p1];
						else return null;
					});
					
					ret = params;
				}
				else ret = params;
			}
			else if(params instanceof Array)
			{
				ret = [];
				for(i = 0, l = params.length; i < l; i++)
				{
					ret[i] = this.resolveParameters(params[i]);
				}
			}
			else if(Object(params) === params)
			{
				ret = {};
				for(i in params)
				{
					ret[i] = this.resolveParameters(params[i]);
				}
			}
			else
			{
				ret = params;
			}
			return ret;
		}
	});

})(this);

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
	
	/**
	 *  kff.View
	 */
	kff.View = kff.createClass(
	{
		mixins: kff.EventsMixin,
		staticProperties:
		{
			DATA_VIEW_ATTR: 'data-kff-view',
			DATA_OPTIONS_ATTR: 'data-kff-options'
		}
	},
	{
		constructor: function(options)
		{
			this.events = new kff.Events();
			this.options = {
				element: null,	
				events: []
			};

			if(options.events)
			{
				this.options.events = this.options.events.concat(options.events);
				delete options.events;
			}

			$.extend(this.options, options);
			
			this.$element = $(this.options.element);

			this.subViews = [];
			return this;
		},


		//     [
		//       ['mousedown, mouseup', '.title', 'edit'],
		//       ['click',  '.button', 'save' ],
		//       ['click', function(e) { ... }]
		//     ]

		delegateEvents: function(events, $element)
		{
			var event, i, l;
			this.undelegateEvents();
			events = events || this.options.events;	
			$element = $element || this.$element;
			for(i = 0, l = events.length; i < l; i++)
			{
				event = events[i];
				if(event.length === 3) $element.on(event[0], event[1], kff.bindFn(this, event[2]));
				else if(event.length === 2) $element.on(event[0], kff.bindFn(this, event[1]));
			}
		},

		undelegateEvents: function(events, $element)
		{
			var event, i, l;
			events = events || this.options.events;	
			$element = $element || this.$element;
			for(i = 0, l = events.length; i < l; i++)
			{
				event = events[i];
				if(event.length === 3) $element.off(event[0], event[1], kff.bindFn(this, event[2]));
				else if(event.length === 2) $element.off(event[0], kff.bindFn(this, event[1]));
			}
		},

		init: function()
		{
			this.render();
		},

		destroy: function(silent)
		{
			this.destroySubviews();
			this.undelegateEvents();
			if(!silent) this.trigger('destroy');
		},

		render: function(silent)
		{
			this.delegateEvents();
			this.renderSubviews();
			if(!silent) this.trigger('init');
		},

		renderSubviews: function()
		{
			var viewNames = [], 
				viewName, viewClass, subView, options, opt, i, l,
				filter = this.options.filter || undefined;
				
			var findViewElements = function(el)
			{
				var j, k, children, child;
				if(el.hasChildNodes())
				{
					children = el.childNodes;
					for(j = 0, k = children.length; j < k; j++)
					{
						child = children[j];
						if(child.getAttribute)
						{
							viewName = child.getAttribute(kff.View.DATA_VIEW_ATTR);
							if(viewName)
							{
								if(!filter || (filter && $(child).is(filter)))
								{
									viewNames.push({ objPath: viewName, $element: $(child) });	
								}						
							}
							else
							{
								findViewElements(child);
							}
						}
					}
				}				
			};
			
			if(this.$element.get(0)) findViewElements(this.$element.get(0));
			
			// Initialize subviews
			for(i = 0, l = viewNames.length; i < l; i++)
			{
				viewClass = kff.evalObjectPath(viewNames[i].objPath);
				if(viewClass)
				{
					opt = viewNames[i].$element.attr(kff.View.DATA_OPTIONS_ATTR);
					options = opt ? JSON.parse(opt) : {};
					options.element = viewNames[i].$element;
					options.parentView = this;
					subView = new viewClass(options);
					this.subViews.push(subView);
					subView.init();
				}
			}			
		},
		
		destroySubviews: function()
		{
			var subView, i, l;
				
			// Destroy subviews
			for(i = 0, l = this.subViews.length; i < l; i++)
			{				
				subView = this.subViews[i];
				subView.destroy();
				delete this.subViews[i];
			}			
			this.subViews = [];
		},
		
		refresh: function()
		{
		}

	});

	/**
	 * kff.PageView
	 */
	kff.PageView = kff.createClass(
	{
		extend: kff.View,
		staticProperties: 
		{
			precedingView: null
		}
	},
	{
		constructor: function(options)
		{
			options.element = $('body');
			return kff.PageView._super.constructor.call(this, options);
		},

		delegateEvents: function(events, $element)
		{
			kff.PageView._super.delegateEvents.call(this, events, $element || $(document));
		},

		undelegateEvents: function(events, $element)
		{
			kff.PageView._super.undelegateEvents.call(this, events, $element || $(document));
		},
		
		setState: function(state, silent)
		{
			if(!silent) this.trigger('setState', state);
		}		
	});
	
	/**
	 * kff.FrontController
	 */
	kff.FrontController = kff.createClass(
	{
		constructor: function() 
		{
			this.views = null;
			this.viewsQueue = [];
		},

		init: function()
		{

		},

		createViewFromState: function(state)
		{
			return null;
		},

		getLastView: function()
		{
			if(this.viewsQueue.length > 0) return this.viewsQueue[this.viewsQueue.length - 1];
			else return null;
		},

		pushView: function(view)
		{
			var lastView = this.getLastView();			
			this.viewsQueue.push(view);
			if(lastView)
			{
				lastView.on('init', kff.bindFn(view, 'init'));
				lastView.on('setState', kff.bindFn(view, 'setState'));
			}
		},

		popView: function()
		{
			if(this.viewsQueue.length === 0) return;

			var removedView = this.viewsQueue.pop(),
				lastView = this.getLastView();
			
			removedView.off('init', kff.bindFn(this, 'cascadeState'));
			if(lastView)
			{
				lastView.off('init', kff.bindFn(removedView, 'init'));
				lastView.off('setState', kff.bindFn(removedView, 'setState'));
			}
			return removedView;
		},

		cascadeState: function()
		{
			if(this.viewsQueue[0]) this.viewsQueue[0].setState(this.state);
		},

		setState: function(state)
		{
			var destroyQueue = [], lastViewCtor, sharedViewCtor, i;
			
			this.state = state;
			this.newViewCtor = this.createViewFromState(state);
			lastViewCtor = this.getLastView() ? this.getLastView().constructor : null;
			sharedViewCtor = this.findSharedView(this.newViewCtor, lastViewCtor);
			
 			while(lastViewCtor = this.getLastView() ? this.getLastView().constructor : null)
			{
				if(lastViewCtor === sharedViewCtor) break;
				destroyQueue.push(this.popView());
			}
			
			for(i = 0; i < destroyQueue.length; i++)
			{
				if(destroyQueue[i + 1]) destroyQueue[i].on('destroy', kff.bindFn(destroyQueue[i + 1], 'destroy'));
				else destroyQueue[i].on('destroy', kff.bindFn(this, 'startInit'));
			};

			if(destroyQueue[0]) destroyQueue[0].destroy();
			else this.startInit();
		},

		startInit: function()
		{			
			var i, l, 
				precedingViewCtors = this.getPrecedingViews(this.newViewCtor), 
				from = 0;
			
			for(i = 0, l = precedingViewCtors.length; i < l; i++)
			{
				if(i >= this.viewsQueue.length) this.pushView(new precedingViewCtors[i](this));
				else from = i + 1;
			}
			
			this.newViewCtor = null;			
			if(this.getLastView()) this.getLastView().on('init', kff.bindFn(this, 'cascadeState'));
			if(this.viewsQueue[from]) this.viewsQueue[from].init();
			else this.cascadeState();
		},

		findSharedView: function(c1, c2)
		{
			var i,
				c1a = this.getPrecedingViews(c1),
				c2a = this.getPrecedingViews(c2),
				c = null;

			for(i = 0, l = c1a.length < c2a.length ? c1a.length : c2a.length; i < l; i++)
			{
				if(c1a[i] !== c2a[i]) break;
				c = c1a[i];
			}
			return c;
		},

		getPrecedingViews: function(viewCtor)
		{
			var c = viewCtor, a = [c];
			
			while(c)
			{
				c = c.precedingView || null;
				if(typeof c === 'string') c =  kff.evalObjectPath(c);
				if(c) a.unshift(c);
			}	
			return a;
		}
	});


})(this);
