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
	else kff = 'kff' in scope ? scope.kff : (scope.kff = {}) ;
	kff.widgets = {};
	
	/**
	 * Extends constructor function (class) from parent constructor using prototype inherinatce
	 * @param {function} child Child class
	 * @param {function} parent Parent class
	 */
	kff.extend = function(child, parent)
	{
		var F = function(){};
		child._super = F.prototype = parent.prototype;
		child.prototype = new F();
		child.prototype.constructor = child;
	};
	
	/**
	 * Mixins (using a shallow copy) properties from one object to another
	 * @param {Object} obj Object to be extended
	 * @param {Object} properties Object by which to extend
	 */
	kff.mixins = function(obj, properties)
	{
		for(var key in properties) if(properties.hasOwnProperty(key)) obj[key] = properties[key];
	};

	/**
	 * Factory for creating a class
	 * @param {Object} meta Object with metadata describing inheritance and static properties of the class
	 * @param {Object} properties Properties of a class prototype (or class members)
	 * @returns {function} A constructor function (class)
	 */
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
		if(!('mixins' in meta))
		{
			meta.mixins = [];
		}
		else if(!(meta.mixins instanceof Array)) meta.mixins = [meta.mixins];
		
		meta.mixins.push(kff.classMixin);
		
		for(var i = 0, l = meta.mixins.length; i < l; i++) kff.mixins(properties, meta.mixins[i]);

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
		if(typeof obj[fnName] !== 'function') throw new TypeError("Expected function: " + fnName + ' (kff.bindFn)');
		if(!('boundFns' in obj)) obj.boundFns = {};
		if(fnName in obj.boundFns) return obj.boundFns[fnName];
		else obj.boundFns[fnName] = function(){ return obj[fnName].apply(obj, arguments); };
		return obj.boundFns[fnName];
	};

	kff.classMixin = {
		f: function(fnName)
		{
			var obj = this;
			if(typeof fnName === 'string') return kff.bindFn(obj, fnName);
			if(typeof fnName === 'function') return function(){ return fnName.apply(obj, arguments); };
			throw new TypeError("Expected function: " + fnName + ' (kff.f)');
		}
	};
	
	kff.isTouchDevice = function()
	{
		return !!('ontouchstart' in window);
	};
	

	kff.evalObjectPath = function(path, obj)
	{
		obj = obj || scope;
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
	else kff = 'kff' in scope ? scope.kff : (scope.kff = {}) ;
	
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
	else kff = 'kff' in scope ? scope.kff : (scope.kff = {}) ;
	
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
	else kff = 'kff' in scope ? scope.kff : (scope.kff = {}) ;

	/**
	 *  kff.Collection
	 *
	 */
	kff.Collection = kff.createClass(
	{ 
		extend: kff.LinkedList,
		mixins: kff.EventsMixin
	},
	{ 
		constructor: function(options)
		{
			options = options || {};
			this.valFactory = options.valFactory || null;
			this.valType = options.valType || kff.Model;
			this.serializeAttrs = options.serializeAttrs || null;
			this.events = new kff.Events();
			kff.LinkedList.call(this);
			return this;
		},

		append: function(val)
		{
			kff.Collection._super.append.call(this, val);
			this.trigger('change', { addedValue: val });
		},
		
		removeVal: function(val)
		{
			if(kff.Collection._super.removeVal.call(this, val)) this.trigger('change', { removedValue: val });
		},
				
		toJson: function()
		{
			var node = this.head, obj = [];
			while(node = node.next)
			{
				if(node.val && node.val.toJson) obj.push(node.val.toJson(this.serializeAttrs));
				else obj.push(node.val);
			}
			return obj;
		},
		
		fromJson: function(obj)
		{
			var val, valFactory = this.valFactory;
			this.empty();
			for(var i = 0; i < obj.length; i++)
			{
				if(valFactory) val = valFactory(obj[i]);
				else val = new this.valType();
				val.fromJson(obj[i]);
				this.append(val);
			}
			this.trigger('change');
		},
		
		findByAttr: function(attr, value)
		{
			var ret;
			this.each(function(val)
			{
				if(val && val.get(attr) === value) ret = val;
			});
			return ret;
		},
		
		empty: function()
		{
			this.tail = this.head = { next: null };
			this.count = 0;
			this.trigger('change');
		},

		sort: function(compareFunction)
		{
			var arr = [], az, bz;
			this.each(function(item)
			{
				arr.push(item);
			});
			arr.sort(compareFunction);
			this.empty();
			for(var i = 0; i < arr.length; i++)
			{
				this.append(arr[i]);
			}
			this.trigger('change');
		},
		
		clone: function()
		{
			var clon = new kff.Collection(this.options);
			this.each(function(item){
				clon.append(item);
			});
			return clon;
		},
		
		shuffle: function()
		{
			var arr = [], az, bz, len, i, p, t;
			this.each(function(item)
			{
				arr.push(item);
			});

			len = arr.length, i = len;
			while(i--)
			{
				p = parseInt(Math.random()*len);
				t = arr[i];
				arr[i] = arr[p];
				arr[p] = t;
			}
			this.empty();
			for(var i = 0; i < arr.length; i++)
			{
				this.append(arr[i]);
			}
			this.trigger('change');
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
	else kff = 'kff' in scope ? scope.kff : (scope.kff = {}) ;

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

		has: function(attr)
		{
			return attr in this.attrs;
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
		},
		
		toJson: function(serializeAttrs)
		{
			var obj = {};
			for(var key in this.attrs)
			{
				if((!serializeAttrs || $.inArray(key, serializeAttrs) !== -1) && this.attrs.hasOwnProperty(key))
				{
					if(this.attrs[key] && typeof this.attrs[key] === 'object' && 'toJson' in this.attrs[key]) obj[key] = this.attrs[key].toJson();
					else obj[key] = this.attrs[key];
				}
			}
			return obj;
		},
		
		fromJson: function(obj)
		{
			var attrs = {};
			for(var key in this.attrs)
			{
				if(this.attrs.hasOwnProperty(key) && obj.hasOwnProperty(key))
				{
					if(this.attrs[key] && typeof this.attrs[key] === 'object' && 'fromJson' in this.attrs[key]) this.attrs[key].fromJson(obj[key]);
					else this.attrs[key] = obj[key];
				}
			}
			this.set(this.attrs);
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
	else kff = 'kff' in scope ? scope.kff : (scope.kff = {}) ;

	/**
	 *  kff.ServiceContainer
	 *
	 */
	kff.ServiceContainer = kff.createClass(
	{
		staticProperties:
		{
			singleParamRegex: /^%[^%]+%$/g,
			multipleParamsRegex: /%([^%]+)%/g
		}
	},
	{
		constructor: function(config)
		{
			this.config = config || { parameters: {}, services: {} };
			this.services = {};
			this.cachedParams = {};
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
		
		hasService: function(serviceName)
		{
			return this.config.services.hasOwnProperty(serviceName);
		},
		
		createService: function(serviceName)
		{
			var serviceConfig, Ctor, Temp, service, ret, i, l, calls;
			
			serviceConfig = this.config.services[serviceName];
			
			Ctor = this.getServiceConstructor(serviceName);			
			Temp = function(){};			
			Temp.prototype = Ctor.prototype;
			service = new Temp();
			ret = Ctor.apply(service, this.resolveParameters(serviceConfig.args || []));	
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
		
		getServiceConstructor: function(serviceName)
		{
			var serviceConfig, ctor;
			serviceConfig = this.config.services[serviceName];
			if(!serviceConfig) return null;
			if(!serviceConfig.hasOwnProperty('constructor'))
			{
				ctor = kff.evalObjectPath(serviceName);
				if(typeof ctor === 'function') serviceConfig.constructor = ctor;
			}
			else if(typeof serviceConfig.constructor === 'string') serviceConfig.constructor = kff.evalObjectPath(serviceConfig.constructor);
			if(typeof serviceConfig.constructor !== 'function') throw new TypeError('expected function');
			return serviceConfig.constructor;
		},
		
		resolveParameters: function(params)
		{
			var ret, i, l, config;
			
			config = this.config;
			
			if(typeof params === 'string')
			{
				if(params.charAt(0) === '@')
				{
					params = params.slice(1);
					if(params.length === 0) ret = this;
					else ret = this.getService(params);
				}
				else if(this.cachedParams[params] !== undefined) ret = this.cachedParams[params];
				else 
				{
					if(params.search(kff.ServiceContainer.singleParamRegex) !== -1)
					{
						ret = config.parameters[params.slice(1, -1)];
					}
					else
					{
						ret = params.replace('%%', 'escpersign');
						ret = ret.replace(kff.ServiceContainer.multipleParamsRegex, function(match, p1)
						{
							if(config.parameters[p1]) return config.parameters[p1];
							else return '';
						});
						ret = ret.replace('escpersign', '%');
					}
					this.cachedParams[params] = ret;					
				}
			}
			else if(params instanceof Array)
			{
				ret = [];
				for(i = 0, l = params.length; i < l; i++)
				{
					ret[i] = this.resolveParameters(params[i]);
				}
			}
			else if(typeof params !== 'function' && Object(params) === params)
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
	else kff = 'kff' in scope ? scope.kff : (scope.kff = {}) ;
	
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
			options = options || {};
			this.events = new kff.Events();
			this.options = {
				element: null,	
				events: []
			};
			this.setOptions(options);
			this.viewFactory = options.viewFactory || new kff.ViewFactory();
			this.subViews = [];
			return this;
		},
		
		setOptions: function(options)
		{
			options = options || {};
			if(options.events)
			{
				this.options.events = this.options.events.concat(options.events);
				delete options.events;
			}
			if(options.element)
			{
				this.$element = $(options.element);
				delete options.element;	
			}
			$.extend(this.options, options);			
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
				viewName = viewNames[i].objPath;
				opt = viewNames[i].$element.attr(kff.View.DATA_OPTIONS_ATTR);
				options = opt ? JSON.parse(opt) : {};
				options.element = viewNames[i].$element;
				options.parentView = this;
				subView = this.viewFactory.createView(viewName, options);
				if(subView instanceof kff.View)
				{
					subView.viewFactory = this.viewFactory;
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
			options = options || {};
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
		constructor: function(options)
		{
			options = options || {};
			this.views = null;
			this.viewsQueue = [];
			this.viewFactory = options.viewFactory || new kff.ViewFactory();
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
				lastView.instance.on('init', kff.bindFn(view.instance, 'init'));
				lastView.instance.on('setState', kff.bindFn(view.instance, 'setState'));
			}
		},

		popView: function()
		{
			if(this.viewsQueue.length === 0) return;

			var removedView = this.viewsQueue.pop(),
				lastView = this.getLastView();
			
			removedView.instance.off('init', kff.bindFn(this, 'cascadeState'));
			if(lastView)
			{
				lastView.instance.off('init', kff.bindFn(removedView.instance, 'init'));
				lastView.instance.off('setState', kff.bindFn(removedView.instance, 'setState'));
			}
			return removedView;
		},

		cascadeState: function()
		{
			if(this.viewsQueue[0]) this.viewsQueue[0].instance.setState(this.state);
		},

		setState: function(state)
		{
			var destroyQueue = [], lastViewCtor, sharedViewCtor, i;
			
			this.state = state;
			this.newViewCtor = this.createViewFromState(state);
			lastViewCtor = this.getLastView() ? this.getLastView().name : null;
			sharedViewCtor = this.findSharedView(this.newViewCtor, lastViewCtor);
			
 			while(lastViewCtor = this.getLastView() ? this.getLastView().name : null)
			{
				if(lastViewCtor === sharedViewCtor) break;
				destroyQueue.push(this.popView());
			}
			
			for(i = 0; i < destroyQueue.length; i++)
			{
				if(destroyQueue[i + 1]) destroyQueue[i].instance.on('destroy', kff.bindFn(destroyQueue[i + 1].instance, 'destroy'));
				else destroyQueue[i].instance.on('destroy', kff.bindFn(this, 'startInit'));
			};

			if(destroyQueue[0]) destroyQueue[0].instance.destroy();
			else this.startInit();
		},

		startInit: function()
		{			
			var i, l, 
				precedingViewCtors = this.getPrecedingViews(this.newViewCtor), 
				from = 0;
			
			for(i = 0, l = precedingViewCtors.length; i < l; i++)
			{
				if(i >= this.viewsQueue.length) this.pushView({ name: precedingViewCtors[i], instance: this.viewFactory.createView(precedingViewCtors[i])});
				else from = i + 1;
			}
			
			this.newViewCtor = null;			
			if(this.getLastView()) this.getLastView().instance.on('init', kff.bindFn(this, 'cascadeState'));
			if(this.viewsQueue[from]) this.viewsQueue[from].instance.init();
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
				c = this.viewFactory.getPrecedingView(c);
				if(c) a.unshift(c);
			}	
			return a;
		}
	});


	/**
	 * kff.ViewFactory
	 */
	kff.ViewFactory = kff.createClass(
	{
		constructor: function(options)
		{
			options = options || {};
			this.serviceContainer = options.serviceContainer || null;
			this.precedingViews = options.precedingViews || {};
		},

		createView: function(viewName, options)
		{
			var view = null, viewClass;
			options = options || {};
			
			if(typeof viewName !== 'function' && this.serviceContainer && this.serviceContainer.hasService(viewName)) view = this.serviceContainer.getService(viewName);
			else
			{
				if(typeof viewName !== 'function') viewClass = kff.evalObjectPath(viewName);
				else viewClass = viewName;
				if(viewClass) view = new viewClass({ viewFactory: this });
			}
			if(view instanceof kff.View) view.setOptions(options);
			return view;
		},
		
		getServiceConstructor: function(viewName)
		{
			if(typeof viewName === 'function') return viewName;
			if(this.serviceContainer && this.serviceContainer.hasService(viewName)) return this.serviceContainer.getServiceConstructor(viewName);
			else return kff.evalObjectPath(viewName);
		},
		
		getPrecedingView: function(viewName)
		{
			var viewCtor;
			if(typeof viewName === 'string' && this.precedingViews[viewName] !== undefined) return this.precedingViews[viewName];
			else
			{
				viewCtor = this.getServiceConstructor(viewName);
				if(viewCtor && viewCtor.precedingView) return viewCtor.precedingView;
			}
			return null;
		}
		
	});
	
})(this);
