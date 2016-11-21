(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define('kff', factory) :
	(global.kff = factory());
}(this, (function () { 'use strict';

	var settings = {
		/**
		 * Data-attribute name used for view names
		 * @constant
		 */
		DATA_VIEW_ATTR: 'data-kff-view',

		/**
		 * Data-attribute name used for view options (as JSON serialized object)
		 * @constant
		 */
		DATA_OPTIONS_ATTR: 'data-kff-options',

		/**
		 * Data-attribute name used for marking of rendered views
		 * @constant
		 */
		DATA_RENDERED_ATTR: 'data-kff-rendered',

		/**
		 * Data-attribute name used for data-binding
		 * @constant
		 */
		DATA_BIND_ATTR: 'data-kff-bind',

		defaultItemAlias: '_item',

		immutableCollections: false
	};

	function arrayConcat(a1, a2)
	{
		var l1 = a1.length, l2 = a2.length, l3 = l1 + l2, i = 0;
		var a3 = new Array(l3);
		while(i < l1)
		{
			a3[i] = a1[i];
			i++;
		}
		while(i < l3)
		{
			a3[i] = a2[i - l1];
			i++;
		}
		return a3;
	}

	/**
	 * Returns index of an item in an array or -1 if not found
	 * This is just a faster replacement for native Array#indexOf
	 * It returns index of first occurence of the item.
	 *
	 * @param  {Array} array The array to search in
	 * @param  {mixed} item  The item to look for
	 * @return {number}      Index of the item
	 */
	function arrayIndexOf(array, item)
	{
		for(var i = 0, l = array.length; i < l; i++)
		{
			if(array[i] === item) return i;
		}
		return -1;
	}

	/**
	 * Compare if two arrays are of the same length and contain the same values compared by the strict equal operator
	 *
	 * @param  {Array} value1 Array 1
	 * @param  {Array} value2 Array 2
	 * @return {boolean}      Result of comparsion
	 */
	function compareArrays(value1, value2)
	{
		if(Array.isArray(value1) && Array.isArray(value2))
		{
			var l = value1.length;
			if(l !== value2.length) return false;
			for(var i = 0; i < l; i++)
			{
				if(value1[i] !== value2[i]) return false;
			}
			return true;
		}
		else return false;
	}

	/**
	 * Binds function to an object with object's *this*.
	 *
	 * Note that it adds a _boundFns property to the object which is an object
	 * containing references to bound methods for caching purposes. It always returns reference to the same function
	 * for each fnName.
	 *
	 * @param {Object} obj Object to which bind a function
	 * @param {string} fnName Method name to bind
	 * @returns {function} Bound function
	 */
	function bindFn(obj, fnName, args)
	{
		if(typeof obj[fnName] !== 'function') throw new TypeError('Expected function: ' + fnName + ' in object ' + obj + '  (bindFn)');
		if(!('_boundFns' in obj)) obj._boundFns = {};
		if(fnName in obj._boundFns) return obj._boundFns[fnName];
		else
		{
			obj._boundFns[fnName] = Function.prototype.bind.apply(obj[fnName], args ? [obj].concat(args) : [obj]);
		}
		return obj._boundFns[fnName];
	}

	/**
	 * Mixins (using a shallow copy) properties from one object to another.
	 * Function accepts multiple arguments with multiple extending objects.
	 * The first object will be extended (modified) by the following object(s).
	 * When passing true as the last argument, deep copy will be executed (any object ).
	 *
	 * @param {Object} obj Object to be extended
	 * @param {Object} properties Extending object(s)
	 * @returns {Object} Extended object (=== obj)
	 */
	function mixins(obj, properties)
	{
		var i = 1, l = arguments.length, key, props;

		while(i < l)
		{
			props = arguments[i];
			var keys = Object.keys(props);
			for(var j = 0, k = keys.length; j < k; j++)
			{
				obj[keys[j]] = props[keys[j]];
			}
			i++;
		}
		return obj;
	}

	/**
	 * Extends constructor function (class) from parent constructor using prototype
	 * inherinatce.
	 *
	 * @public
	 * @param {function} child Child class
	 * @param {function} parent Parent class
	 */
	function extend(child, parent)
	{
		child.prototype = Object.create(parent.prototype);
		child._super = parent.prototype;
		child.prototype.constructor = child;
	}

	var classMixin = {
		f: function(fnName, args)
		{
			if(typeof fnName === 'string') return bindFn(this, fnName, args);
			if(typeof fnName === 'function')
			{
				return Function.prototype.bind.apply(fnName, args ? [this].concat(args) : [this]);
			}
			throw new TypeError("Expected function: " + fnName + ' (f)');
		}
	};


	/**
	 * Factory function for creating a class
	 *
	 * The first "meta" parameter must be an object with the following optional properties:
	 * * extend - reference to base class to be extended
	 * * statics - object with static properties of the class. These properties will be set directly to the constructor
	 *   function
	 *
	 * @param {Object} meta Object with metadata describing inheritance and static properties of the class
	 * @param {Object} properties Properties of a class prototype (or class members)
	 * @returns {function} A constructor function (class)
	 */
	function createClass(meta, properties)
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
		if(meta.extend) extend(constructor, meta.extend);

		// Concatenate properties from properties objects and mixin objects
		if(!('mixins' in meta))
		{
			meta.mixins = [];
		}
		else if(!Array.isArray(meta.mixins)) meta.mixins = [meta.mixins];

		meta.mixins.push(classMixin);

		for(var i = 0, l = meta.mixins.length; i < l; i++) mixins(properties, meta.mixins[i]);

		// Static properties of constructor
		if(meta.statics)
		{
			mixins(constructor, meta.statics);
		}

		// Add properties to prototype
		mixins(constructor.prototype, properties);

		// Set proper constructor
		constructor.prototype.constructor = constructor;

		return constructor;
	}

	/**
	 * Detects if an object is a plain javascript object (object created as literal
	 * or by new Object). Very simple implementation not as robust as the jQuery one
	 * but better performing.
	 *
	 * @param  {mixed}  obj Object to detect
	 * @return {Boolean} True if object is a plain object, false otherwise
	 */
	function isPlainObject(obj)
	{
		return obj !== null && typeof obj === 'object' && (obj.constructor === Object || obj.constructor === undefined);
	}

	/**
	 * Mixins (using a shallow copy) properties from one object to another.
	 * Function accepts multiple arguments with multiple extending objects.
	 * The first object will be extended (modified) by the following object(s).
	 * When passing true as the last argument, deep copy will be executed (any object ).
	 *
	 * @param {Object} obj Object to be extended
	 * @param {Object} properties Extending object(s)
	 * @returns {Object} Extended object (=== obj)
	 */
	function deepMixins(obj, properties)
	{
		var i = 1, l = arguments.length, key, props, prop, objProp;
		while(i < l)
		{
			props = arguments[i];

			var keys = Object.keys(props);

			for(var j = 0, k = keys.length; j < k; j++)
			{
				key = keys[j];
				prop = props[key];
				if(isPlainObject(prop))
				{
					objProp = obj[key];
					if(typeof objProp !== 'object' || objProp === null) obj[key] = objProp = {};
					deepMixins(objProp, prop);
				}
				else obj[key] = prop;
			}
			i++;
		}
		return obj;
	}

	/**
	 * Logs a debug message to the console if settings.debug is set to true
	 * @param  {string} message The message to log
	 */
	function log(message)
	{
		if(typeof console === 'object') console.log(message);
	}

	/**
	 * Calls a function in the next process cycle with minimal timeout. It is like
	 * setTimeout(fn, 0) but with better performance (does not obey the internal
	 * browser limits for timeout that exist due to backward compatibility).
	 *
	 * Fallbacks to setTimeout on older MSIE.
	 *
	 * @param  {function}  fn Callback function
	 */

	var setImmediate = null;

	var callbacks = [];
	var messageName = 'kff-setimmediate-msg';

	var handleMessage = function(event)
	{
		if(event.source === window && event.data === messageName)
		{
			event.stopPropagation();
			if(callbacks.length > 0) callbacks.shift()();
		}
	};

	if(typeof window === 'object' && 'postMessage' in window && 'addEventListener' in window && !('attachEvent' in window))
	{
		setImmediate = function(fn)
		{
			callbacks.push(fn);
			window.postMessage(messageName, '*');
		};
		window.addEventListener('message', handleMessage, true);
	}
	else
	{
		setImmediate = function(fn)
		{
			setTimeout(fn, 0);
		};
	}

	var setImmediate$1 = setImmediate;

	function curry(fn, arity)
	{
		var __slice = Array.prototype.slice;
		arity = arity || fn.length;

		return given([]);

		function given(argsSoFar)
		{
			return function helper()
			{
				var updatedArgsSoFar = argsSoFar.concat(__slice.call(arguments, 0));

				if (updatedArgsSoFar.length >= arity) {
					return fn.apply(this, updatedArgsSoFar);
				}
				else return given(updatedArgsSoFar);
			};
		}
	}

	function compose()
	{
		var fns = arguments;
		return function(result)
		{
			for(var i = fns.length - 1; i > -1; i--)
			{
				result = fns[i].call(this, result);
			}
			return result;
		};
	}

	var map = curry(function(fn, obj)
	{
		return obj.map(fn);
	});

	function imclone(obj)
	{
		if(obj instanceof Array) return obj.slice();
		if(typeof obj === 'object' && obj !== null)
		{
			var keys = Object.keys(obj);
			var key;
			var ret = {};
			for(var j = 0, k = keys.length; j < k; j++)
			{
				key = keys[j];
				ret[key] = obj[key];
			}
			return ret;
		}
		return obj;
	}

	function deepFreeze(o)
	{
			try {
		if(typeof o === 'object' && o !== null)
		{
			if(!Object.isFrozen(o)) Object.freeze(o);


			Object.getOwnPropertyNames(o).forEach(function (prop)
			{
				if(o.hasOwnProperty(prop) && o[prop] !== null && typeof o[prop] === "object" && !Object.isFrozen(o[prop]))
				{
					deepFreeze(o[prop]);
				}
			});

		}
			}
			catch(e) {
				console.log('fr', o);
			}

		return o;
	}

	function imset(keypath, value, obj)
	{
		var fn = value;
		var root;
		if(typeof fn !== 'function') fn = function(){ return value; };

		if(keypath)
		{
			if(typeof keypath === 'string') keypath = keypath.split('.');

			root = imclone(obj);
			var prev = root;

			if(keypath.length === 0) return fn(root);

			for(var i = 0, l = keypath.length; i < l - 1; i++)
			{
				prev = prev[keypath[i]] = imclone(prev[keypath[i]]);
			}

			prev[keypath[i]] = fn(prev[keypath[i]]);
		}
		else
		{
			root = fn(obj);
		}

		// if("production" !== 'production')
		// {
		// 	deepFreeze(root);
		// }

		return root;
	}

	function imremove(keypath, obj)
	{
		var root;
		if(typeof keypath === 'string') keypath = keypath.split('.');

		if(keypath)
		{
			root = imclone(obj);
			var prev = root;

			for(var i = 0, l = keypath.length; i < l - 1; i++)
			{
				prev = prev[keypath[i]] = imclone(prev[keypath[i]]);
			}
			if(Array.isArray(prev))
			{
				prev = prev.splice(keypath[i], 1);
			}
			else if(typeof prev === 'object' && prev !== null)
			{
				delete prev[keypath[i]];
			}
		}

		// if("production" !== 'production')
		// {
		// 	deepFreeze(root);
		// }
		return root;
	}

	function immerge(source, target)
	{
		var clone;
		if(typeof target === 'object' && target !== null && typeof source === 'object' && source !== null)
		{
			clone = imclone(source);
			var keys = Object.keys(target);
			var key;
			for(var j = 0, k = keys.length; j < k; j++)
			{
				key = keys[j];
				if(source.hasOwnProperty(key))
				{
					clone[key] = immerge(source[key], target[key]);
					// if("production" !== 'production')
					// {
					// 	deepFreeze(clone[key]);
					// }
				}
				else
				{
					clone[key] = target[key];
				}
			}
			// if("production" !== 'production')
			// {
			// 	Object.freeze(clone);
			// }
			return clone;
		}
		else if(Array.isArray(source) && Array.isArray(target))
		{
			clone = source.slice();
			for(var i = 0, l = Math.max(source.length, target.length); i < l; i++)
			{
				if(i in target) clone[i] = immerge(clone[i], target[i]);
			}
			// if("production" !== 'production')
			// {
			// 	deepFreeze(clone);
			// }
			return clone;
		}
		else
		{
			return target;
		}
	}

	/**
	 * Empty placeholder function
	 */
	function noop(){}

	var requestAnimationFrame = (typeof window === 'object' ? window.requestAnimationFrame : false) || function(fn){ setTimeout(fn, 1000/60); };

	function afterRepaint(fn)
	{
		requestAnimationFrame(function()
		{
			setTimeout(fn, 0);
		});
	}

	function viewClassFactory(ctor, defaultOptions)
	{
		return function(options)
		{
			return new ctor(mixins({}, (typeof defaultOptions === 'function' ? defaultOptions() : defaultOptions) || {}, options || {}));
		}
	}

	function matchBindingOperatorName(input)
	{
		var match = /^:([a-zA-Z_$][0-9a-zA-Z_$]*)/.exec(input);
		if(match)
		{
			return { match: match[1], rest: input.slice(match[0].length)};
		}
		else
		{
			return { error: 'Syntax error: expectin operator name ' + input };
		}
	}

	function matchIdentifier(input)
	{
		var match = /^[a-zA-Z_$*%][0-9a-zA-Z_$-]*/.exec(input);
		if(match)
		{
			return { match: match[0], rest: input.slice(match[0].length)};
		}
		else
		{
			return { error: 'Syntax error: expecting identifier ' + input };
		}
	}

	function matchUnquotedString(input)
	{
		var match = /^[^,()):]*/.exec(input);
		if(match)
		{
			return { match: match[0], rest: input.slice(match[0].length)};
		}
		else
		{
			return { error: 'Syntax error: expecting unquoted string ' + input };
		}
	}

	function matchString(input)
	{
		var match = /^'((\\\'|\\|[^'\\]+)*)'/.exec(input);
		if(match)
		{
			return { match: match[1].replace("\'", '\''), rest: input.slice(match[0].length)};
		}
		else
		{
			return { error: 'Syntax error: expecting string ' + input };
		}
	}

	function matchNumber(input)
	{
		var match = /^[+-]?((0(b|B)[0|1]+)|(0(o|O)[0-7]+)|(0(x|X)[0-9a-fA-F]+)|(\d+(\.\d+)?((e|E)(\+|\-)?\d+)?))/.exec(input);

		if(match)
		{
			return { match: Number(match[0]), rest: input.slice(match[0].length)};
		}
		else
		{
			return { error: 'Syntax error: expecting number ' + input };
		}
	}

	function matchBoolean(input)
	{
		var match = /^(true|false)[^a-zA-Z0-9_$*]/.exec(input);
		if(match)
		{
			return { match: match[1], rest: input.slice(match[1].length)};
		}
		else
		{
			return { error: 'Syntax error: expecting boolean ' + input };
		}
	}

	function matchNull(input)
	{
		var match = /^(null)[^a-zA-Z0-9_$*]/.exec(input);
		if(match)
		{
			return { match: match[1], rest: input.slice(match[1].length)};
		}
		else
		{
			return { error: 'Syntax error: expecting null ' + input };
		}
	}

	function matchUndefined(input)
	{
		var match = /^(undefined)[^a-zA-Z0-9_$*]/.exec(input);
		if(match)
		{
			return { match: match[1], rest: input.slice(match[1].length)};
		}
		else
		{
			return { error: 'Syntax error: expecting undefined ' + input };
		}
	}

	function matchEos(input)
	{
		var match = input.length === 0;
		if(match)
		{
			return { match: 'eos', rest: null };
		}
		else
		{
			return { error: 'Syntax error: expecting end of string ' + input };
		}
	}

	var matchSingleChar = curry(function(char, input)
	{
		if(input[0] === char)
		{
			return { match: char, rest: input.slice(1)};
		}
		else
		{
			return { error: 'Syntax error: expecting character ' + char + ' rest:' + input };
		}
	});

	var matchPeriod = matchSingleChar('.');
	var matchAt = matchSingleChar('@');
	var matchComma = matchSingleChar(',');

	var matchOr = curry(function(args, input)
	{
		for(var i = 0; i < args.length; i++)
		{
			var result = args[i](input);
			if(!result.error)
			{
				return result;
			}
		}

		return { error: 'Syntax error: cannot parse ' + input }
	});

	var matchSequence = curry(function(args, input)
	{
		var sequence = [];

		for(var i = 0; i < args.length; i++)
		{
			var result = args[i](input);
			if(!result.error)
			{
				sequence.push(result.match);
				input = result.rest;
			}
			else break;
		}

		if(sequence.length !== args.length)
		{
			return result;
		}

		return { match: sequence, rest: input };
	});

	function flattenArray(arr)
	{
		return arr.reduce(function(a, b) {
		  return a.concat(b);
		}, []);
	}

	var flattenMatch = curry(function(fn, input)
	{
		var result = fn(input);
		if(!result.error)
		{
			return { match: flattenArray(result.match), rest: result.rest };
		}
		else return result;
	});

	var matchMultiple = curry(function(fn, input)
	{
		var matches = [];

		do {
			var result = fn(input);
			if(!result.error)
			{
				matches.push(result.match);
				input = result.rest;
			}
			else break;
		} while(true)

		if(matches.length === 0)
		{
			return { error: 'Syntax error: empty multiple ' + input };
		}

		return { match: matches, rest: input };
	});

	var matchOptional = curry(function(fn, input)
	{
		var result = fn(input);

		if(!result.error)
		{
			return result;
		}

		return { match: null, rest: input };
	});

	function odds(element, i)
	{
		return !(i % 2);
	}

	function notNull(element, i)
	{
		return element != null;
	}

	function convertNullToStar(result)
	{
		if(result.match == null)
		{
			result.match = '*';
		}
		return result;
	}

	function matchKeyPath(input)
	{
		var result = flattenMatch(matchSequence([
			matchPostProcess(convertNullToStar, matchOptional(matchIdentifier)),
			compose(matchOptional, flattenMatch, matchMultiple, matchSequence)([matchPeriod, matchOptional(matchIdentifier) ])
		]))(input);

		if(!result.error) result.match = result.match.filter(odds).filter(notNull);

		return result;
	}

	var skipWhiteSpace = function(fn)
	{
		return compose(fn, skipSpace);
	};

	var matchPostProcess = curry(function(ppFn, fn, input)
	{
		var result = fn(input);

		if(!result.error)
		{
			return ppFn(result);
		}

		return result;
	});


	var matchCursor = matchPostProcess(function(result)
	{
		return {
			match: {
				type: 'cursor',
				keyPath: result.match[1]
			},
			rest: result.rest
		};
	}, matchSequence([matchAt, matchKeyPath]));

	var matchCursorValue = matchPostProcess(function(result)
	{
		return {
			match: {
				type: 'cursorValue',
				keyPath: result.match[2]
			},
			rest: result.rest
		};
	}, matchSequence([matchAt, matchAt, matchKeyPath]));


	var matchFunction = matchPostProcess(function(result)
	{
		return {
			match: {
				type: 'function',
				name: result.match[0],
				params: result.match[1]
			},
			rest: result.rest
		};
	}, matchSequence([matchIdentifier, matchOperatorParams]));

	var matchNumberObject = matchPostProcess(function(result)
	{
		return {
			match: {
				type: 'number',
				value: result.match
			},
			rest: result.rest
		};
	}, matchNumber);

	var matchIdentifierObject = matchPostProcess(function(result)
	{
		return {
			match: {
				type: 'ident',
				value: result.match
			},
			rest: result.rest
		};
	}, matchIdentifier);

	var matchUnquotedStringObject = matchPostProcess(function(result)
	{
		return {
			match: {
				type: 'ident',
				value: result.match
			},
			rest: result.rest
		};
	}, matchUnquotedString);

	var matchStringObject = matchPostProcess(function(result)
	{
		return {
			match: {
				type: 'string',
				value: result.match
			},
			rest: result.rest
		};
	}, matchString);

	var matchBooleanObject = matchPostProcess(function(result)
	{
		return {
			match: {
				type: 'boolean',
				value: result.match === 'true'
			},
			rest: result.rest
		};
	}, matchBoolean);

	var matchNullObject = matchPostProcess(function(result)
	{
		return {
			match: {
				type: 'null',
				value: null
			},
			rest: result.rest
		};
	}, matchNull);

	var matchUndefinedObject = matchPostProcess(function(result)
	{
		return {
			match: {
				type: 'undefined',
				value: undefined
			},
			rest: result.rest
		};
	}, matchUndefined);


	var operands = [matchNullObject, matchUndefinedObject, matchBooleanObject, matchNumberObject, matchCursorValue, matchCursor, matchStringObject, matchUnquotedStringObject];

	var matchNamedParam = matchPostProcess(function(result)
	{
		return {
			match: {
				type: 'namedParam',
				name: result.match[0],
				operand: result.match[2]
			},
			rest: result.rest
		};
	}, matchSequence([skipWhiteSpace(matchIdentifier), skipWhiteSpace(matchSingleChar(':')), skipWhiteSpace(matchOr(operands))]));


	var matchOperand = matchOr([matchNamedParam, matchFunction].concat(operands));


	function matchOperatorParamsList(input)
	{
		var result = flattenMatch(matchSequence([
			skipWhiteSpace(matchOperand),
			compose(matchOptional, flattenMatch, matchMultiple, matchSequence)([skipWhiteSpace(matchComma), skipWhiteSpace(matchOperand)])
		]))(input);

		if(result.match)
		{
			result = {
				type: 'params',
				match: result.match.filter(function(item){ return item !== null && item !== ','; }),
				rest: result.rest
			};
		}
		return result;
	}

	function matchOperatorParams(input)
	{
		var result = flattenMatch(matchSequence([
			matchSingleChar('('),
			matchOptional(matchOperatorParamsList),
			skipWhiteSpace(matchSingleChar(')'))
		]))(input);

		if(result.match)
		{
			result = {
				type: 'params',
				match: result.match.filter(function(item){ return item !== '(' && item !== ')'; }),
				rest: result.rest
			};
		}
		return result;
	}

	var matchBindingOperator = matchPostProcess(function(result)
	{
		return {
			match: {
				type: 'operator',
				name: result.match[0],
				args: result.match[1] || []
			},
			rest: result.rest
		};
	}, matchSequence([matchBindingOperatorName, matchOptional(matchOperatorParams)]));


	var matchBinding = matchPostProcess(function(result)
	{
		return {
			match: {
				type: 'binding',
				keyPath: result.match[0],
				modelArgs: result.match[1] || [],
				binder: result.match[2],
				binderArgs: result.match[3] || [],
				operators: result.match[4] || []
			},
			rest: result.rest
		};
	}, skipWhiteSpace(matchSequence([
			matchKeyPath,
			matchOptional(matchOperatorParams),
			matchBindingOperatorName,
			matchOptional(matchOperatorParams),
			matchOptional(matchMultiple(matchBindingOperator))
		])));


	var matchBindings = matchPostProcess(function(result)
	{
		return {
			match: {
				bindings: result.match.filter(function(item){ return item !== 'eos'; }),
			},
			rest: result.rest
		};
	}, flattenMatch(matchSequence([skipWhiteSpace(matchMultiple(matchBinding)), skipWhiteSpace(matchEos)])));


	function skipSpace(string)
	{
		var first = string.search(/\S/);
		if(first === -1) return "";
		return string.slice(first);
	}




	var parseBinding = Object.freeze({
		matchIdentifier: matchIdentifier,
		matchNumber: matchNumber,
		matchKeyPath: matchKeyPath,
		matchBindingOperatorName: matchBindingOperatorName,
		matchOr: matchOr,
		matchCursor: matchCursor,
		matchCursorValue: matchCursorValue,
		skipWhiteSpace: skipWhiteSpace,
		matchOperatorParams: matchOperatorParams,
		matchBinding: matchBinding,
		matchBindings: matchBindings
	});

	var Cursor = createClass(
	{
		constructor: function(root, keyPath)
		{
			if(typeof keyPath === 'string') keyPath = keyPath.split('.');
			this.keyPath = keyPath || [];

			if(root instanceof Cursor)
			{
				this.superRoot = root.superRoot;
				this.keyPath = arrayConcat(root.keyPath, this.keyPath);
			}
			else
			{
				this.superRoot = { root: root };
				// if("production" !== 'production')
				// {
				// 	deepFreeze(root);
				// }
			}
		},

		refine: function(keyPath)
		{
			return new Cursor(this, keyPath);
		},

		get: function()
		{
			return this.getInPath(this.keyPath);
		},

		getIn: function(keyPath)
		{
			if(typeof keyPath === 'string') keyPath = keyPath.split('.');
			return this.getInPath(this.keyPath.concat(keyPath));
		},

		getInPath: function(path)
		{
			var part,
				obj = this.superRoot.root,
				i, l;

			for(i = 0, l = path.length; i < l; i++)
			{
				part = path[i];
				if(typeof obj !== 'object' || obj === null || obj[part] === undefined) return null;
				else obj = obj[part];
			}
			return obj;
		},

		set: function(value)
		{
			this.superRoot.root = imset(this.keyPath, value, this.superRoot.root);
		},

		setIn: function(path, value)
		{
			this.refine(path).set(value);
		},

		update: function(fn)
		{
			this.superRoot.root = imset(this.keyPath, fn, this.superRoot.root);
		},

		remove: function()
		{
			this.superRoot.root = imremove(this.keyPath, this.superRoot.root);
		},

		equalsTo: function(cursor)
		{
			if(!cursor || cursor.superRoot.root !== this.superRoot.root) return false;
			return compareArrays(this.keyPath, cursor.keyPath);
		}

	});

	var EventStream = createClass({
		statics: {
			END: {}
		}
	},
	/** @lends EventStream.prototype */
	{
		/**
		 * @constructs
		 */
		constructor: function()
		{
			this.subscribers = [];
			this.oneSubscribers = [];
			this.endSubscribers = [];
		},

		/**
		 * Binds event handler.
		 *
		 * @param {string|Array} eventType Event name(s)
		 * @param {function} fn Event handler
		 */
		on: function(fn)
		{
			if(arrayIndexOf(this.subscribers, fn) === -1) this.subscribers.push(fn);
			return this;
		},

		onEnd: function(fn)
		{
			if(arrayIndexOf(this.endSubscribers, fn) === -1) this.endSubscribers.push(fn);
			return this;
		},

		/**
		 * Binds event handler that will be executed only once.
		 *
		 * @param {string|Array} eventType Event name(s)
		 * @param {function} fn Event handler
		 */
		one: function(eventType, fn)
		{
			this.oneSubscribers.push(fn);
			return this.on(fn);
		},

		/**
		 * Unbinds event handler.
		 *
		 * @param {string|Array} eventType Event name(s)
		 * @param {function} fn Event handler
		 */
		off: function(fn)
		{
			var i = arrayIndexOf(this.subscribers, fn);
			if(i !== -1) this.subscribers.splice(i, 1);

			i = arrayIndexOf(this.oneSubscribers, fn);
			if(i !== -1) this.oneSubscribers.splice(i, 1);

			i = arrayIndexOf(this.endSubscribers, fn);
			if(i !== -1) this.endSubscribers.splice(i, 1);

			return this;
		},

		offAll: function()
		{
			this.subscribers = [];
			this.oneSubscribers = [];
			this.endSubscribers = [];
			return this;
		},

		/**
		 * Triggers an event.
		 *
		 * @param {string|Array} eventType Event name(s)
		 * @param {mixed} eventData Arbitrary data that will be passed to the event handlers as an argument
		 */
		trigger: function(eventData)
		{
			var i, l;

			if(eventData === EventStream.END)
			{
				for(i = 0, l = this.endSubscribers.length; i < l; i++)
				{
					if(typeof this.endSubscribers[i] === 'function') this.endSubscribers[i].call(null);
				}
				return this.offAll();
			}

			for(i = 0, l = this.subscribers.length; i < l; i++)
			{
				if(typeof this.subscribers[i] === 'function') this.subscribers[i].call(null, eventData);
			}

			// Remove "one" subscribers:
			for(i = 0, l = this.oneSubscribers.length; i < l; i++)
			{
				this.off(this.oneSubscribers[i]);
			}


			return this;
		},

		triggerLater: function(eventData, delay)
		{
			var that = this;
			if(delay === undefined) delay = 0;
			setTimeout(function()
			{
				that.trigger(eventData);
			}, delay);
			return this;
		},


		map: function(fn)
		{
			var mes = new EventStream();

			this.on(function(event){
				mes.trigger(fn.call(null, event));
			});

			this.onEnd(function(){
				mes.end();
			});

			return mes;
		},

		reduce: function(fn, initialValue)
		{
			var es = new EventStream();
			var value;

			if(typeof fn !== 'function')
			{
				throw new TypeError( fn + ' is not a function' );
			}

			if(arguments.length >= 2)
			{
				value = arguments[1];
			}

			this.on(function(event){
				value = fn.call(null, value, event);
			});

			this.onEnd(function(){
				es.trigger(value).end();
			});

			return es;
		},

		flatMap: function(fn)
		{
			var mes = new EventStream();
			var activeStreams = 0;

			var observe = function(event)
			{
				var res = fn.call(null, event);

				if(res instanceof EventStream)
				{
					activeStreams++;
					res.on(function(event2)
					{
						mes.trigger(event2);
					});

					res.onEnd(function()
					{
						activeStreams--;
						if(activeStreams === 0) mes.end();
					});
				}
				else
				{
					mes.trigger(res);
				}
			};

			this.on(observe);
			this.onEnd(function()
			{
				if(activeStreams === 0) mes.end();
			});

			return mes;
		},

		filter: function(fn)
		{
			var fes = new EventStream();

			this.on(function(event){
				if(fn.call(null, event)) fes.trigger(event);
			});

			this.onEnd(function(){
				fes.end();
			});

			return fes;
		},

		merge: function(es)
		{
			var mes = new EventStream();
			var endCount = 2;

			function endHandler()
			{
				endCount--;
				if(endCount === 0) mes.end();
			}

			this.on(mes.f('trigger'));
			es.on(mes.f('trigger'));

			this.onEnd(endHandler);
			es.onEnd(endHandler);

			return mes;
		},

		end: function()
		{
			this.trigger(EventStream.END);
		},

		endLater: function(delay)
		{
			var that = this;
			if(delay === undefined) delay = 0;
			setTimeout(function()
			{
				that.trigger(EventStream.END);
			}, delay);
			return this;
		}
	});

	if(typeof document === 'object' && document !== null)
	{
		var matchesMethodName;
		if('webkitMatchesSelector' in document.documentElement) matchesMethodName = 'webkitMatchesSelector';
		else if('mozMatchesSelector' in document.documentElement) matchesMethodName = 'mozMatchesSelector';
		else if('oMatchesSelector' in document.documentElement) matchesMethodName = 'oMatchesSelector';
		else if('msMatchesSelector' in document.documentElement) matchesMethodName = 'msMatchesSelector';
	}

	/**
	 * Matches target element against CSS selector starting from element el
	 *
	 * @param  {DOMElement} el     Root DOM element
	 * @param  {DOMElement} target Target DOM element
	 * @param  {string} selector   CSS selector
	 * @return {boolean}           True if target element matches CSS selector, false otherwise
	 */
	function matches(el, target, selector)
	{
		var elements = el.querySelectorAll(selector);
		return arrayIndexOf(elements, target) !== -1;
	}


	/**
	 * Intermediate event handler for delegating event to its appropriate handler(s)
	 *
	 * @param  {DOMElement} el    DOM element
	 * @param  {string} selector  CSS selector
	 * @param  {function} handler Event handler
	 * @param  {DOMEvent} event   DOM event
	 */
	function delegatedEventHandler(el, selector, handler, event)
	{
		var target = event.target;

		while(target && target !== el)
		{
			if(matchesMethodName)
			{
				if(target[matchesMethodName](selector))
				{
					event.matchedTarget = target;
					handler.call(target, event);
					break;
				}
			}
			else
			{
				if(matches(el, target, selector))
				{
					event.matchedTarget = target;
					handler.call(target, event);
					break;
				}
			}
			target = target.parentNode;
		}
	}

	/**
	 * Delegates DOM events on this element
	 *
	 * @param  {string} type      Event type (i.e. 'click')
	 * @param  {string} selector  CSS selector
	 * @param  {function} handler Event handler
	 */
	function on(handlers, element, type, selector, handler)
	{
		var types = type.split(/\s+/);
		for(var i = 0, l = types.length; i < l; i++)
		{
			if(arguments.length === 5)
			{
				if(!handlers[selector])
				{
					handlers[selector] = delegatedEventHandler.bind(null, element, selector, handler);
				}
				element.addEventListener(types[i], handlers[selector], false);
			}
			else
			{
				// now selector = handler
				element.addEventListener(types[i], selector, false);
			}
		}
	}

	/**
	 * Unbinds delegated DOM event handler from this element
	 *
	 * @param  {string} type      Event type (i.e. 'click')
	 * @param  {string} selector  CSS selector
	 * @param  {function} handler Previously bound event handler
	 */
	function off(handlers, element, type, selector)
	{
		var types = type.split(/\s+/);
		for(var i = 0, l = types.length; i < l; i++)
		{
			if(typeof selector !== 'function')
			{
				if(handlers[selector])
				{
					element.removeEventListener(types[i], handlers[selector], false);
					handlers[selector] = undefined;
				}
			}
			else
			{
				element.removeEventListener(types[i], selector, false);
			}
		}
	}

	/**
	 * Iteratively finds a DOM node next to the current node or a DOM node next to
	 * the parent node if the current node is the last child. When deep argument is
	 * true, the searching will also step into the child nodes.
	 *
	 * @param  {Node} root a root node or context for searching
	 * @param  {Node} node current node
	 * @param  {boolean} deep if true, search in child nodes too
	 * @return {Node} next found node
	 */
	function nextNode(root, node, deep)
	{
		var parentNode, nextSibling, tempNode;
		do {
			if(deep && (tempNode = node.firstChild))
			{
				node = tempNode;
			}
			else
			{
				parentNode = node.parentNode;
				nextSibling = node.nextSibling;
				while(node !== root && nextSibling === null && parentNode !== null)
				{
					node = parentNode;
					parentNode = node.parentNode;
					nextSibling = node.nextSibling;
				}
				if(node && node !== root) node = nextSibling;
				else node = null;
			}
		} while (node && node.nodeType !== 1);
		return node;
	}

	/**
	 * Finds possible subview elements inside an element
	 *
	 * @param  {DOM Element} el Root element from which search starts
	 * @return {Object} array of found views metadata {viewName, index, element, options}
	 */
	function findViewElements(el)
	{
		var node = el, viewName = null, rendered, onAttr, optAttr, index = 0, subviewsStruct = null;

		while((node = nextNode(el, node, viewName === null)) !== null)
		{
			viewName = null;
			rendered = node.getAttribute(settings.DATA_RENDERED_ATTR);

			if(!rendered)
			{
				viewName = node.getAttribute(settings.DATA_VIEW_ATTR);
				if(!viewName && node.getAttribute(settings.DATA_BIND_ATTR))
				{
					viewName = 'View';
					node.setAttribute(settings.DATA_VIEW_ATTR, viewName);
				}
				if(viewName)
				{
					optAttr = node.getAttribute(settings.DATA_OPTIONS_ATTR);
					if(subviewsStruct === null) subviewsStruct = [];
					subviewsStruct.push({
						viewName: viewName,
						index: index,
						element: node,
						options: optAttr ? JSON.parse(optAttr) : {}
					});
				}
			}
			index++;
		}
		return subviewsStruct;
	}

	function filterByEventType(type)
	{
		return function(o){ return o.type === type; };
	}

	var Dispatcher = createClass(
	{
		constructor: function(actions, processors)
		{
			this.eventStream = new EventStream();
			this.actionStreams = {};
			this.processors = [processsArrayEvent, processsEventStreamEvent, processsPromiseEvent, processsActionEvent];
			if(processors && Array.isArray(processors))
			{
				this.processors = this.processors.concat(processors);
			}
			this.registerActions(actions);
			this.callbacks = [];
		},

		createCallback: function(fn)
		{
			var dispatcher = this;
			if(typeof fn !== 'function') {
				throw new Error('Dispatcher action "' + fn + '" is not a function');
			}
			if(fn.length <= 1)
			{
				return function(event)
				{
					var nextEvent = fn.call(null, event);
					dispatcher.trigger(nextEvent);
				};
			}
			else
			{
				return function(event)
				{
					var done = function(err, nextEvent)
					{
						if(err) return;
						if(nextEvent) dispatcher.trigger(nextEvent);
					};
					fn.call(null, event, done);
				};
			}
		},

		registerActions: function(actions)
		{
			if(typeof actions === 'object')
			{
				for(var action in actions)
				{
					if(typeof actions[action] === 'function') {
						this.actionStreams[action] = this.eventStream.filter(filterByEventType(action)).on(this.createCallback(actions[action]));
					}
					else {}
				}
			}
		},

		trigger: function(event)
		{
			for(var j = 0; j < this.processors.length; j++)
			{
				if(typeof this.processors[j] === 'function') this.processors[j](this, event);
			}
		},

		on: function(type, fn)
		{
			if(!(type in this.actionStreams)) this.actionStreams[type] = this.eventStream.filter(filterByEventType(type));

			var callback = this.createCallback(fn);
			this.callbacks.push({
				type: type,
				fn: fn,
				callback: callback
			});

			this.actionStreams[type].on(callback);
		},

		off: function(type, fn)
		{
			for(var i = this.callbacks.length - 1; i >= 0; i--)
			{
				if(this.callbacks[i].type === type && this.callbacks[i].fn === fn)
				{
					if(type in this.actionStreams) this.actionStreams[type].off(this.callbacks[i].callback);
					this.callbacks.splice(i, 1);
				}
			}
		},

		hasAction: function(action)
		{
			return action in this.actionStreams;
		}
	});

	function processsArrayEvent(dispatcher, event)
	{
		if(Array.isArray(event))
		{
			for(var j = 0; j < event.length; j++)
			{
				dispatcher.trigger(event[j]);
			}
		}
	}

	function processsEventStreamEvent(dispatcher, event)
	{
		if(event instanceof EventStream)
		{
			event.on(dispatcher.f('trigger'));
		}
	}

	function processsActionEvent(dispatcher, event)
	{
		if(event != null && typeof event === 'object' && 'type' in event)
		{
			if(dispatcher.hasAction(event.type)) dispatcher.eventStream.trigger(event);
			else dispatcher.eventStream.trigger({ type: 'dispatcher:noaction', value: event });
		}
	}

	function processsPromiseEvent(dispatcher, event)
	{
		if(event != null && typeof event === 'object' && typeof event.then === 'function')
		{
			event.then(dispatcher.f('trigger'));
		}
	}

	function callModelAsFunction(view, model, modelArgs)
	{
		return model.apply(null, modelArgs || []);
	}

	function insertBefore(parentNode, anchorNode, node)
	{
		if(parentNode)
		{
			parentNode.insertBefore(node, anchorNode);
		}
	}

	function removeChild(parentNode, node, fn)
	{
		if(parentNode)
		{
			parentNode.removeChild(node);
		}
		fn();
	}

	var CollectionBinder = createClass(
	/** @lends Binder.prototype */
	{
		/**
		 * @constructs
		 */
		constructor: function(options)
		{
			this.collection = null;
			this.keyPath = options.keyPath;
			this.collectionArgs = options.collectionArgs;
			this.view = options.view;
			this.elementTemplate = null;
			this.boundViews = null;
			this.anchor = null;
			this.viewTemplate = null;
			this.animate = options.animate;
			this.keyProp = options.keyProp;
		},

		/**
		 * Renders "bound" views.
		 * This method generates DOM elements corresponding to each item in the bound collection and
		 * creates the bindingView for each element. If the collection changes, it reflects those changes
		 * automatically in real time.
		 *
		 * @private
		 */
		renderBoundViews: function()
		{
			this.anchor = this.view.env.document.createTextNode('');
			var el = this.view.element;

			if(el.parentNode)
			{
				el.parentNode.insertBefore(this.anchor, el.nextSibling);
				el.parentNode.removeChild(el);
			}

			this.boundViews = [];

			// Boundview options:
			this.boundViewName = this.view.element.getAttribute(settings.DATA_VIEW_ATTR);
			var opt = this.view.element.getAttribute(settings.DATA_OPTIONS_ATTR);

			this.boundViewOptions = opt ? JSON.parse(opt) : {};
			this.boundViewOptions.parentView = this.view;
			this.boundViewOptions.env = this.view.env;
			this.boundViewOptions.isBoundView = true;

			this.refreshBoundViews();
		},

		/**
		 * Destroys previously bound views.
		 *
		 * @private
		 */
		destroyBoundViews: function()
		{
			var boundView, i, l;

			// Destroy boundviews
			if(this.boundViews !== null)
			{
				for(i = 0, l = this.boundViews.length; i < l; i++)
				{
					boundView = this.boundViews[i];
					boundView.destroyAll();
					if(boundView.element && boundView.element.parentNode) boundView.element.parentNode.removeChild(boundView.element);
				}
				this.boundViews = null;
			}

			if(this.anchor)
			{
				if(this.anchor.parentNode)
				{
					this.anchor.parentNode.insertBefore(this.view.element, this.anchor.nextSibling);
					this.anchor.parentNode.removeChild(this.anchor);
				}
				this.anchor = null;
			}
			if(this.elementTemplate)
			{
				if(this.elementTemplate.parentNode)
				{
					this.elementTemplate.parentNode.removeChild(this.elementTemplate);
				}
				this.elementTemplate = null;
			}
			this.viewTemplate = null;
			if(this.collection) this.collection = null;
		},

		refreshAll: function()
		{
			if(this.boundViews !== null)
			{
				for(var i = 0, l = this.boundViews.length; i < l; i++) this.boundViews[i].refreshAll();
			}
		},

		/**
		 * Updates bound views when collection changes.
		 *
		 * @private
		 * @param {Object} event An event triggered by collection change
		 */
		refreshBoundViews: function(event)
		{
			this.refreshBoundViewsAll();
		},

		rebindCollection: function()
		{
			this.cursor = this.view.getCursor(this.keyPath);
			this.collection = this.cursor.get();

			if(typeof this.collection === 'function')
			{
				this.collection = callModelAsFunction.call(this.view, this.collection, this.collectionArgs);
			}
			if(!Array.isArray(this.collection)) this.collection = [];
		},

		/**
		 * Updates bound views when collection changes on other events.
		 *
		 * @private
		 */
		refreshBoundViewsAll: function()
		{
			var boundView, i, l, el, a;
			var lastView, lastChild, parentNode, item;
			var insertBefore$$1 = insertBefore;
			var removeChild$$1 = removeChild;
			var oldCollection = this.collection;

			if(this.animate)
			{
				insertBefore$$1 = this.view.scope[this.animate]['insert'];
				removeChild$$1 = this.view.scope[this.animate]['remove'];
			}

			this.rebindCollection();

			// This will speed up rendering but requires strictly immutable collections
			if(settings.immutableCollections && oldCollection === this.collection) return;

			if(this.boundViews === null) this.boundViews = [];

			if(this.boundViews.length === 0)
			{
				// Fast initial rendering:
				l = this.collection.length;
				if(l > 0)
				{
					a = this.collection;
					lastChild = this.anchor;
					if(this.anchor && this.anchor.parentNode)
					{
						parentNode = this.anchor.parentNode;
						for(i = 0; i < l; i++)
						{
							boundView = this.createBoundView(a[i]);
							this.boundViews[i].runAll();
							this.boundViews[i].afterRunAll();
							el = boundView.element;
							insertBefore$$1(parentNode, lastChild.nextSibling, el);
							lastChild = el;
						}
					}
				}
			}
			else
			{
				// Diff based rendering:
				var newCollection = this.collection;
				var newBoundViews = [];
				var recycledViews = [];
				var oldCollectionKeyMap;
				var newCollectionKeyMap;
				if(this.keyProp)
				{
					oldCollectionKeyMap = {};
					for(i = 0, l = oldCollection.length; i < l; i++)
					{
						oldCollectionKeyMap[oldCollection[i][this.keyProp]] = i;
					}

					newCollectionKeyMap = {};
					for(i = 0, l = newCollection.length; i < l; i++)
					{
						newCollectionKeyMap[newCollection[i][this.keyProp]] = i;
					}
				}

				// Merge old and new bound view arrays:
				var tempBoundViews = [];
				for(i = 0, l = Math.max(oldCollection.length, newCollection.length); i < l; i++)
				{
					if(oldCollection[i] && getKeyedItemIndex(newCollection, oldCollection[i], this.keyProp, newCollectionKeyMap) === -1)
					{
						// Item is in the old collection but not in the new one
						boundView = this.boundViews[i];
						if(this.animate)
						{
							tempBoundViews.push(boundView);
							lastView = boundView;
						}
						else lastView = null;
						recycledViews.push(boundView);
					}
					if(newCollection[i])
					{
						// Item is in the new collection
						var oldIndex = getKeyedItemIndex(oldCollection, newCollection[i], this.keyProp, oldCollectionKeyMap);
						if(oldIndex !== -1)
						{
							// Item is already rendered, reuse its view
							boundView = this.boundViews[oldIndex];
							tempBoundViews.push(boundView);
							boundView.scope['*'] = this.cursor.refine([i]);
							if(this.view._itemAlias) boundView.scope[this.view._itemAlias] = boundView.scope['*'];
							boundView.setBindingIndex(i);
							newBoundViews.push(boundView);
							lastView = boundView;
						}
						else
						{
							// Item is new, create new binding view
							if(this.animate || recycledViews.length === 0)
							{
								boundView = this.createBoundView(newCollection[i]);
								boundView.scope['*'] = this.cursor.refine([i]);
								if(this.view._itemAlias) boundView.scope[this.view._itemAlias] = boundView.scope['*'];
								boundView.setBindingIndex(i);
								boundView.runAll();
								boundView.afterRunAll();
							}
							else
							{
								boundView = recycledViews.shift();
								boundView.scope['*'] = this.cursor.refine([i]);
								if(this.view._itemAlias) boundView.scope[this.view._itemAlias] = boundView.scope['*'];
								boundView.setBindingIndex(i);
							}
							tempBoundViews.push(boundView);
							newBoundViews.push(boundView);
							lastView = null;
						}
					}
				}

				if(lastView)
				{
					// Reordering elements from the last one:
					lastChild = lastView.element;
					i = tempBoundViews.length - 1;

					el = tempBoundViews[i].element;
					if(el !== lastChild && lastChild.parentNode && lastChild.parentNode.nodeType === 1 && el !== lastChild.nextSibling)
					{
						insertBefore$$1(lastChild.parentNode, lastChild.nextSibling, el);
						lastChild = el;
					}

					for(; i >= 0; i--)
					{
						el = tempBoundViews[i].element;
						var nextSibling = el.nextSibling;
						if(el !== lastChild && nextSibling !== lastChild && lastChild.parentNode && lastChild.parentNode.nodeType === 1)
						{
							insertBefore$$1(lastChild.parentNode, lastChild, el);
						}
						lastChild = el;
						tempBoundViews[i].refreshIndexedBinders(true);
					}
				}
				else
				{
					// Add elements after anchor text node:
					lastChild = this.anchor;
					if(this.anchor.parentNode)
					{
						parentNode = this.anchor.parentNode;
					}
					for(i = 0, l = tempBoundViews.length; i < l; i++)
					{
						el = tempBoundViews[i].element;

						if(el !== lastChild.nextSibling)
						{
							insertBefore$$1(parentNode, lastChild.nextSibling, el);
						}
						tempBoundViews[i].refreshIndexedBinders(true);
						lastChild = el;
					}
				}
				this.boundViews = newBoundViews;

				// Remove old views:
				for(i = 0, l = recycledViews.length; i < l; i++)
				{
					var viewToRemove = recycledViews[i];
					if(viewToRemove.element && viewToRemove.element.parentNode)
					{
						removeNodeAsync(viewToRemove, removeChild$$1);
					}
				}
			}
		},

		/**
		 * Refreshes view indices when the collection changes
		 *
		 * @private
		 * @param  {nubmer} from Render index at which reindexing starts
		 * @param  {number} to   Render index at which reindexing ends
		 */
		reindexBoundviews: function(from, to)
		{
			if(!from) from = 0;
			if(!to || to > this.boundViews.length) to = this.boundViews.length;

			// Reindex subsequent boundviews:
			for(var i = from; i < to; i++)
			{
				this.boundViews[i].setBindingIndex(i);
				this.boundViews[i].refreshBinders(true);
			}
		},

		/**
		 * Creates a new bound view for item in collection
		 *
		 * @private
		 * @param  {Object} item Item for data-binding
		 * @param  {number} i 		Binding index
		 * @return {View} 		created view
		 */
		createBoundView: function(item)
		{
			var boundView, element, i;

			if(!this.viewTemplate)
			{
				element = this.view.element.cloneNode(true);

				this.boundViewOptions.element = element;

				boundView = new this.view.constructor(this.boundViewOptions);

				boundView._collectionBinder = null;
				boundView._modelBindersMap = this.view._modelBindersMap.clone();

				this.boundViews.push(boundView);
				i = this.boundViews.length - 1;

				boundView.scope['*'] = this.cursor.refine([i]);
				if(this.view._itemAlias) boundView.scope[this.view._itemAlias] = boundView.scope['*'];

				boundView.setBindingIndex(i);

				boundView.renderAll();

				this.viewTemplate = boundView._clone();
				this.elementTemplate = element.cloneNode(true);
			}
			else
			{
				element = this.elementTemplate.cloneNode(true);
				boundView = this.viewTemplate._clone();
				boundView._setParentView(this.view);

				this.boundViews.push(boundView);
				i = this.boundViews.length - 1;

				boundView.scope['*'] = this.cursor.refine([i]);
				if(this.view._itemAlias) boundView.scope[this.view._itemAlias] = boundView.scope['*'];

				boundView.setBindingIndex(i);
				boundView._rebindElement(element);
			}

			element.setAttribute(settings.DATA_RENDERED_ATTR, true);

			boundView._itemAlias = this.view._itemAlias;
			boundView._modelBindersMap.setView(boundView);

			return boundView;
		},

		refreshBinders: function(force)
		{
			this.refreshBoundViews();
			if(this.boundViews !== null)
			{
				for(var i = 0, l = this.boundViews.length; i < l; i++) this.boundViews[i].refreshBinders(force);
			}
		},

		refreshIndexedBinders: function()
		{
			if(this.boundViews !== null)
			{
				for(var i = 0, l = this.boundViews.length; i < l; i++) this.boundViews[i].refreshIndexedBinders();
			}
		},

		getCollectionIndex: function(item)
		{
			if(Array.isArray(this.collection))
			{
				return arrayIndexOf(this.collection, item);
			}
			else return -1;
		}
	});

	function removeNodeAsync(view, removeFn)
	{
		view.suspendAll();
		removeFn(view.element.parentNode, view.element, function()
		{
			view.destroyAll();
		});
	}

	function getKeyedItemIndex(collection, item, keyProp, keyMap)
	{
		if(keyProp && keyProp in item)
		{
			var key = item[keyProp];
			if(key in keyMap) return keyMap[key];
			else return -1;
		}
		else
		{
			return arrayIndexOf(collection, item);
		}
	}

	var BinderMap = createClass(
	/** @lends BinderMap.prototype */
	{
		/**
		 * Class for keeping multiple view binders together
		 *
		 * @constructs
		 */
		constructor: function()
		{
			this.binders = [];
		},

		/**
		 * Adds binder
		 * @param {Binder} binder Binder to add
		 */
		add: function(binder)
		{
			this.binders.push(binder);
		},

		/**
		 * Clones binder map
		 *
		 * @return {BinderMap}  Cloned binder map
		 */
		clone: function()
		{
			var clonedBinderMap = new BinderMap(),
				clonedBinders = clonedBinderMap.binders,
				l = this.binders.length;

			while(l--)
			{
				clonedBinders[l] = this.binders[l].clone();
			}
			return clonedBinderMap;
		},

		/**
		 * Sets an owner view to the binder map
		 *
		 * @param {BindingView} view Owner view
		 */
		setView: function(view)
		{
			var i, l, b;
			for(i = 0, l = this.binders.length; i < l; i++)
			{
				b = this.binders[i];
				b.view = view;
				b.element = view.element;
				b.model = null;
				b.value = null;
			}
		},

		/**
		 * Inits all binders
		 */
		initBinders: function()
		{
			for(var i = 0, l = this.binders.length; i < l; i++) this.binders[i].init();
		},

		/**
		 * Destroys all binders
		 */
		destroyBinders: function()
		{
			for(var i = 0, l = this.binders.length; i < l; i++) this.binders[i].destroy();
		},

		/**
		 * Refreshes all binders
		 *
		 * @param  {boolean} force Force rebinding models and refreshing DOM
		 */
		refreshBinders: function(force)
		{
			for(var i = 0, l = this.binders.length; i < l; i++) this.binders[i].modelChange(null, force);
		},

		/**
		 * Run binders' afterRun methods
		 */
		afterRun: function(force)
		{
			for(var i = 0, l = this.binders.length; i < l; i++) this.binders[i].afterRun();
		},


		/**
		 * Rebinds models of all binders
		 */
		rebindCursors: function()
		{
			for(var i = 0, l = this.binders.length; i < l; i++) this.binders[i].rebindCursor();
		},

		/**
		 * Refreshes only binders that depend on their binding index
		 */
		refreshIndexedBinders: function()
		{
			for(var i = 0, l = this.binders.length; i < l; i++)
			{
				if(this.binders[i].isIndexed())
				{
					this.binders[i].modelChange(null, true);
				}
			}
		}

	});

	// import evalObjectPath from './functions/evalObjectPath.js';
	function mixin(obj, properties)
	{
		var key;
		var keys = Object.keys(properties);

		for(var j = 0, k = keys.length; j < k; j++)
		{
			key = keys[j];
			obj[key] = properties[key];
		}

		return obj;
	}

	function actionSet(event)
	{
		event.cursor.set(event.value);
		return {
			type: 'refreshFromRoot'
		};
	}

	var View = createClass(
	{
		statics: {

			/**
			 * Object hash that holds references to binder classes under short key names
			 * @private
			*/
			binders: {},

			helpers: {},

			/**
			 * Registers binder class
			 *
			 * @param {string} alias Alias name used in binding data-attributes
			 * @param {Binder} binder Binder class to register
			 */
			registerBinder: function(alias, binder)
			{
				View.binders[alias] = binder;
			},

			/**
			 * Registers helper function to be used as parser/formatter
			 *
			 * @param {string} alias Name of helper function
			 * @param {function} helper Helper function
			 */
			registerHelper: function(alias, helper)
			{
				View.helpers[alias] = helper;
			}
		}
	},
	/** @lends View.prototype */
	{
		/**
		 * Base class for views
		 *
		 * @constructs
		 * @param {Object} options Options object
		 * @param {DOM Element|jQuery} options.element A DOM element that will be a root element of the view
		 * @param {Array} options.scope Array of model instances to be used by the view
		 */
		constructor: function(options)
		{
			options = options || {};

			this._modelBindersMap = null;
			this._collectionBinder = null;
			this._bindingIndex = null;
			this._itemAlias = null;

			this._subviewsStruct = null;
			this._explicitSubviewsStruct = null;
			this._pendingRefresh = false;
			this._subviewsArgs = null;
			this._isRunning = false;
			this._isSuspended = false;
			this._template = null;
			this._isolated = false;
			this.subviews = null;

			if(options.isolated)
			{
				this._isolated = true;
			}

			if(options.parentView)
			{
				this.scope = options.scope || null;
				this._setParentView(options.parentView);
			}
			else if(options.scope) this.scope = mixin({}, options.scope);
			else this.scope = {};

			options.scope = null;

			if(options.events)
			{
				this.domEvents = options.events.slice();
			}
			else this.domEvents = [];

			if(options.dispatcher)
			{
				this.dispatcher = options.dispatcher;
			}
			else this.dispatcher = null;

			if(options.actions)
			{
				this.actions = mixin({
					set: actionSet
				}, options.actions);
			}
			else if((this.parentView == null || this._isolated )&& !options._clone)
			{
				this.actions = {
					set: actionSet
				};
			}
			else this.actions = null;

			if(options.env)
			{
				this.env = options.env;
			}
			else this.env = { document: document, window: window };

			if(options.element)
			{
				this.element = options.element;
				options.element = null;
			}
			else this.element = this.env.document.body;

			this.options = options;
		},


		/**
		 * Renders the view. It will be called automatically. Should not be called
		 * directly.
		 */
		render: noop,

		/**
		 * Runs the view. It will be called automatically. Should not be called
		 * directly.
		 */
		run: noop,

		afterRun: noop,

		suspend: noop,

		resume: noop,

		/**
		 * Method for refreshing the view. Does nothing in this base class, it's intended to be overloaded in subclasses.
		 */
		refresh: noop,

		/**
		 * Destroys the view (destroys all subviews and unbinds previously bound DOM events.
		 * It will be called automatically. Should not be called directly.
		 */
		destroy: noop,

		initAll: function()
		{
			this.renderAll();
			this.runAll();
			this.afterRunAll();
		},

		/**
		 * Renders the view. It will be called automatically. Should not be called
		 * directly.
		 */
		renderAll: function()
		{
			if(!this._modelBindersMap) this._initBinding();
			if(!this._collectionBinder)
			{
				this._explicitSubviewsStruct = null;

				if(this._template) this.element.innerHTML = this._template;

				if(this.render !== noop) this.render();
				this.renderSubviews();
			}
		},

		/**
		 * Runs the view (i.e. binds events and models). It will be called automatically. Should not be called
		 * directly.
		 */
		runAll: function()
		{
			if(this._collectionBinder)
			{
				this.runSubviews();
			}
			else
			{
				if(this._modelBindersMap) this._modelBindersMap.initBinders();

				if(this.run !== noop) this.run();
				this.runSubviews();

				this.delegateEvents();

				if(this.actions)
				{
					if(!this.dispatcher) this.dispatcher = new Dispatcher();
					this.dispatcher.registerActions(this.actions);
				}

				if(this.dispatcher)
				{
					this.dispatcher.on('refresh', this.f('refreshAll'));
					this.dispatcher.on('refreshFromRoot', this.f('refreshFromRoot'));
					this.dispatcher.on('dispatcher:noaction', this.f('_dispatchNoAction'));
				}

				if(typeof this.afterRender === 'function') this.afterRender();

				this.element.setAttribute(settings.DATA_RENDERED_ATTR, true);

				this._refreshOwnBinders(true);
			}
			this._isRunning = true;
		},

		afterRunAll: function()
		{
			if(this._modelBindersMap)
			{
				this._modelBindersMap.afterRun();
			}
			if(this._collectionBinder)
			{
				this.afterRunSubviews();
			}
			else
			{
				if(this.afterRun !== noop) this.afterRun();
				this.afterRunSubviews();
			}
		},

		isSuspended: function()
		{
			return this._isSuspended;
		},

		suspendAll: function()
		{
			if(!this._isSuspended)
			{
				if(this._collectionBinder)
				{
					this.suspendSubviews();
				}
				else
				{
					this._isSuspended = true;
					if(this.suspend !== noop) this.suspend();
					this.suspendSubviews();
				}
			}
		},

		resumeAll: function()
		{
			if(this._isSuspended)
			{
				if(this._collectionBinder)
				{
					this.resumeSubviews();
				}
				else
				{
					this._isSuspended = false;
					if(this.resume !== noop) this.resume();
					this.resumeSubviews();
				}
			}
		},

		requestRefreshAll: function()
		{
			if(this.env.window.requestAnimationFrame)
			{
				if(!this._pendingRefresh)
				{
					this._pendingRefresh = true;
					this.env.window.requestAnimationFrame(this.f('refreshAll'));
				}
			}
			else this.refreshAll();
		},

		/**
		 * Refreshes all binders, subviews and bound views
		 */
		refreshAll: function()
		{
			if(this._isRunning && !this._isSuspended)
			{
				var shouldRefresh = true;
				if(typeof this.shouldRefresh === 'function') shouldRefresh = this.shouldRefresh();
				if(shouldRefresh)
				{
					if(typeof this.refresh === 'function') this.refresh();
					if(this._collectionBinder)
					{
						this._collectionBinder.refreshBoundViews();
						this._collectionBinder.refreshAll();
					}
					else
					{
						this._rebindCursors();
						this._refreshOwnBinders();
						if(this.subviews !== null)
						{
							for(var i = 0, l = this.subviews.length; i < l; i++) this.subviews[i].refreshAll();
						}
					}
				}
				this._pendingRefresh = false;
			}
		},

		/**
		 * Refreshes all views from root
		 */
		refreshFromRoot: function()
		{
			var view = this;
			while(view.parentView)
			{
				view = view.parentView;
			}

			if(view.dispatcher !== null)
			{
				view.dispatcher.trigger({ type: 'refresh' });
			}
		},

		/**
		 * Destroys the view (destroys all subviews and unbinds previously bound DOM events.
		 * It will be called automatically. Should not be called directly.
		 */
		destroyAll: function()
		{
			this._destroyBinding();

			if(this._collectionBinder) this._collectionBinder.destroyBoundViews();

			this._modelBindersMap = null;
			this._collectionBinder = null;
			this._bindingIndex = null;
			this._itemAlias = null;

			this.element.removeAttribute(settings.DATA_RENDERED_ATTR);
			this.undelegateEvents();
			this.destroySubviews();
			if(this.dispatcher)
			{
				this.dispatcher.off('refresh', this.f('refreshAll'));
				this.dispatcher.off('refreshFromRoot', this.f('refreshFromRoot'));
				this.dispatcher.off('dispatcher:noaction', this.f('_dispatchNoAction'));
			}

			if(this.destroy !== noop) this.destroy();
			if(typeof this.afterDestroy === 'function') this.afterDestroy();

			this._subviewsStruct = null;
			this._explicitSubviewsStruct = null;
			this.subviews = null;
			this._isRunning = false;
			this._isSuspended = false;
		},

		/**
		 * Renders subviews. Will find all DOM descendats with
		 * settings.DATA_KFF_VIEW (or settings.DATA_BIND_ATTR) attribute and
		 * initializes subviews on them. If an element has the
		 * settings.DATA_BIND_ATTR but not the settings.DATA_KFF_VIEW attribute,
		 * adds settings.DATA_KFF_VIEW attribute = "View" and inits
		 * implicit data-binding.
		 */
		renderSubviews: function()
		{
			if(!this._collectionBinder)
			{
				var i, l, element = this.element,
					subView, options, opt, rendered, subviewsStruct = null;

				if(element) this._subviewsStruct = findViewElements(element);

				if(this._explicitSubviewsStruct !== null)
				{
					if(this._subviewsStruct === null) this._subviewsStruct = [];
					subviewsStruct = arrayConcat(this._subviewsStruct, this._explicitSubviewsStruct);
				}
				else if(this._subviewsStruct !== null) subviewsStruct = this._subviewsStruct.slice();

				// Render subviews
				if(subviewsStruct !== null)
				{
					for(i = 0, l = subviewsStruct.length; i < l; i++)
					{
						options = subviewsStruct[i].options;
						options.element = subviewsStruct[i].element;
						options.env = this.env;
						subView = this.createView(subviewsStruct[i].viewName, options);
						if(subView instanceof View)
						{
							subView.renderAll();
						}
					}
				}
			}
		},

		/**
		 * Runs subviews
		 */
		runSubviews: function()
		{
			if(this._collectionBinder)
			{
				this._collectionBinder.renderBoundViews();
			}
			else
			{
				if(this.subviews)
				{
					for(var i = 0, l = this.subviews.length; i < l; i++)
					{
						this.subviews[i].runAll();
					}
				}
			}
		},

		afterRunSubviews: function()
		{
			if(this.subviews)
			{
				for(var i = 0, l = this.subviews.length; i < l; i++)
				{
					this.subviews[i].afterRunAll();
				}
			}
		},

		suspendSubviews: function()
		{
			if(this.subviews)
			{
				for(var i = 0, l = this.subviews.length; i < l; i++)
				{
					this.subviews[i].suspendAll();
				}
			}
		},

		resumeSubviews: function()
		{
			if(this.subviews)
			{
				for(var i = 0, l = this.subviews.length; i < l; i++)
				{
					this.subviews[i].resumeAll();
				}
			}
		},

		/**
		 * Destroys the subviews. It will be called automatically. Should not be called directly.
		 */
		destroySubviews: function()
		{
			if(this._collectionBinder)
			{
				this._collectionBinder.destroyBoundViews();
			}
			else
			{
				var subView, i, l;

				// Destroy subviews
				if(this.subviews !== null)
				{
					for(i = 0, l = this.subviews.length; i < l; i++)
					{
						subView = this.subviews[i];
						subView.destroyAll();
					}
				}
				this.subviews = null;
				this._subviewsStruct = null;
			}
		},

		/**
		 * Destroys and renders+runs the view with optional new html content
		 * @param  {string} html HTML tepmlate (optional)
		 */
		rerender: function(html)
		{
			this.destroyAll();
			if(html !== undefined) this.element.innerHTML = html;
			this.initAll();
		},


		/**
		 * Returns a model object bound to the view or to the parent view.
		 *
		 * Accepts the model name as a string or key path in the form of "modelName.attribute.nextAttribute etc.".
		 * Will search for "modelName" in current view, then in parent view etc. When found, returns a value of
		 * "attribute.nextAtrribute" using model's	mget method.
		 *
		 * @param {string} modelPath Key path of model in the form of "modelName.attribute.nextAttribute etc.".
		 * @return {mixed} A model instance or attribute value or null if not found.
		 */
		getCursor: function(keyPath)
		{
			if(typeof keyPath === 'string') keyPath = keyPath.split('.');

			var rootCursorName = keyPath[0];
			keyPath = keyPath.slice(1);
			var rootCursor = this.scope[rootCursorName];
			if(!(rootCursor instanceof Cursor)) rootCursor = new Cursor(rootCursor, keyPath);

			var cursor = rootCursor.refine(keyPath);

			return cursor;
		},

		/**
		 * Adds events config to the internal events array.
		 *
		 * @private
		 * @param {Array} events Array of arrays of binding config
		 */
		addEvents: function(events)
		{
			if(!Array.isArray(events))
			{
				if(arguments.length === 2 || arguments.length === 3) this.domEvents.push(Array.prototype.slice.apply(arguments));
				return;
			}
			else if(!Array.isArray(events[0]))
			{
				events = Array.prototype.slice.apply(arguments);
			}
			Array.prototype.push.apply(this.domEvents, events);
		},

		/**
		 * Binds DOM events to the view element. Accepts array of arrays in the form:
		 *
		 * [
		 *     ['mousedown, mouseup', '.title', 'edit'],
		 *     ['click',  '.button', 'save' ],
		 *     ['click', function(e) { ... }]
		 * ]
		 *
		 * The first item is name of DOM event (or comma separated event names).
		 * The second item is a CSS experession (jquery expression) relative to the view element for event delegation (optional)
		 * The third item is the view method name (string) that acts as an event handler
		 *
		 * @param {Array} events Array of arrays of binding config
		 * @param {DOMElement} element A DOM element to bind. If not provided, the view element will be used.
		 */
		delegateEvents: function(events, element)
		{
			var event, i, l, fn;
			this.undelegateEvents(events, element);
			events = events || this.domEvents;

			if(!element)
			{
				element = this.element;
				if(this.env && element === this.env.document.body) element = this.env.document;
			}

			for(i = 0, l = events.length; i < l; i++)
			{
				event = events[i];
				if(event.length >= 3)
				{
					if(typeof event[2] === 'string') fn = this.f(event[2]);
					else fn = event[2];

					if(typeof event[1] === 'string') on(this.handlers, element, event[0], event[1], fn);
					else event[1].on(event[0], fn);
				}
				else if(event.length === 2)
				{
					if(typeof event[1] === 'string') fn = this.f(event[1]);
					else fn = event[1];
					on(this.handlers, element, event[0], fn);
				}
			}
		},

		/**
		 * Unbinds DOM events from the view element. Accepts array of arrays as in
		 * the delegateEvents method.
		 *
		 * @param {Array} events Array of arrays of binding config
		 * @param {DOMElement} element A DOM element to unbind. If not provided, the view element will be used.
		 */
		undelegateEvents: function(events, element)
		{
			var event, i, l, fn;
			events = events || this.domEvents;
			if(!this.handlers) this.handlers = {};

			if(!element)
			{
				element = this.element;
				if(this.env && element === this.env.document.body) element = this.env.document;
			}

			for(i = 0, l = events.length; i < l; i++)
			{
				event = events[i];
				if(event.length >= 3)
				{
					if(typeof event[2] === 'string') fn = this.f(event[2]);
					else fn = event[2];

					if(typeof event[1] === 'string') off(this.handlers, element, event[0], event[1]);
					else event[1].off(event[0], fn);
				}
				else if(event.length === 2)
				{
					if(typeof event[1] === 'string') fn = this.f(event[1]);
					else fn = event[1];

					off(this.handlers, element, event[0], fn);
				}
			}
		},

		/**
		 * Creates a new subview and adds it to the internal subviews list.
		 * Do not use this method directly, use addSubview method instead.
		 *
		 * @private
		 * @param  {String} viewName Name of the view
		 * @param  {Object} options  Options object for the subview constructor
		 * @return {View}        Created view
		 */
		createView: function(viewName, options)
		{
			var subView, args;

			if(this._subviewsArgs && Array.isArray(this._subviewsArgs[viewName]))
			{
				args = this._subviewsArgs[viewName];
				if(typeof args[0] === 'object' && args[0] !== null) options = immerge(options, args[0]);
			}

			options.parentView = this;

			if(viewName === 'View') subView = new View(options);
			else if(viewName in this.scope) subView = new this.scope[viewName](options);
			if(subView instanceof View)
			{
				if(this.subviews === null) this.subviews = [];
				this.subviews.push(subView);
			}
			return subView;
		},

		/**
		 * Adds subview metadata to the internal list. The subviews from this list
		 * are then rendered in renderSubviews method which is automatically called
		 * when the view is rendered.
		 *
		 * This method can be used is in the render method to manually create a view
		 * that is not parsed from html/template (for example for an element that
		 * sits at the end od the body element).
		 *
		 * @param {DOM element} element Element of the subview
		 * @param {String} viewName Name of the view
		 * @param {[type]} options  Options object for the subview constructor
		 */
		addSubview: function(element, viewName, options)
		{
			if(this._explicitSubviewsStruct === null) this._explicitSubviewsStruct = [];
			this._explicitSubviewsStruct.push({
				viewName: viewName,
				element: element,
				options: options || {}
			});
		},

		setTemplate: function(template)
		{
			this._template = template;
		},

		/**
		 * Refreshes data-binders in all subviews.
		 *
		 * @param  {Object} event Any event object that caused refreshing
		 */
		refreshBinders: function(force)
		{
			if(this._collectionBinder)
			{
				this._collectionBinder.refreshBinders(force);
			}
			else
			{
				this._refreshOwnBinders(force);
				if(this.subviews !== null)
				{
					for(var i = 0, l = this.subviews.length; i < l; i++) this.subviews[i].refreshBinders(force);
				}
			}
		},

		/**
		 * Refreshes all indexed binders of this view or subviews
		 *
		 * @private
		 * @return {[type]} [description]
		 */
		refreshIndexedBinders: function()
		{
			if(this._collectionBinder)
			{
				this._collectionBinder.refreshIndexedBinders();
			}
			else
			{
				if(this._modelBindersMap)
				{
					this._modelBindersMap.refreshIndexedBinders();
				}
				if(this.subviews !== null)
				{
					for(var i = 0, l = this.subviews.length; i < l; i++) this.subviews[i].refreshIndexedBinders();
				}
			}
		},

		/**
		 * Dispatches event to the dispatcher
		 *
		 * @param  {object} event Event object to dispatch
		 */
		dispatchEvent: function(event)
		{
			if(!this._isSuspended)
			{
				var res, view = this;
				while(view)
				{
					if(view.dispatcher !== null && view.dispatcher.hasAction(event.type))
					{
						{
							view.dispatcher.trigger(event);
						}
						break;
					}
					if(view._isolated) view = null;
					else view = view.parentView;
				}
			}
		},


		/**
		 * Returns index of item in bound collection (closest collection in the view scope)
		 *
		 * @return {number} Item index
		 */
		getBindingIndex: function(modelName)
		{
			modelName = modelName || '*';
			if(this._bindingIndex !== null && this.scope.hasOwnProperty(modelName)) return this._bindingIndex;
			if(this.parentView instanceof View) return this.parentView.getBindingIndex(modelName);
			return null;
		},

		/**
		 * Sets current binding index
		 *
		 * @private
		 */
		setBindingIndex: function(index)
		{
			this._bindingIndex = index;
		},

		_dispatchNoAction: function(event)
		{
			if(this.parentView)
			{
				this.parentView.dispatchEvent(event.value);
			}
		},

		/**
		 * Clones this binding view
		 *
		 * @return {View} Cloned view
		 */
		_clone: function()
		{
			var l;
			var clonedSubview;
			var options = this.options;

			options.parentView = null;
			options.env = this.env;
			options._clone = true;

			var clonedView = new this.constructor(options);

			if(this.subviews !== null)
			{
				l = this.subviews.length;
				clonedView.subviews = new Array(l);
				while(l--)
				{
					clonedSubview = this.subviews[l]._clone();
					clonedView.subviews[l] = clonedSubview;
				}
			}

			if(this._subviewsStruct !== null)
			{
				clonedView._subviewsStruct = this._subviewsStruct.slice();
			}
			if(this._explicitSubviewsStruct !== null)
			{
				clonedView._explicitSubviewsStruct = this._explicitSubviewsStruct.slice();
			}

			if(this._collectionBinder)
			{
				clonedView._collectionBinder = new CollectionBinder(
				{
					view: clonedView,
					keyPath: this._collectionBinder.keyPath,
					animate: this._collectionBinder.animate,
					keyProp: this._collectionBinder.keyProp,
					collection: null,
					collectionPathArray: this._collectionBinder.collectionPathArray
				});
			}

			if(this._modelBindersMap)
			{
				clonedView._modelBindersMap = this._modelBindersMap.clone();
				clonedView._modelBindersMap.setView(clonedView);
			}
			clonedView._itemAlias = this._itemAlias;

			return clonedView;
		},

		_setParentView: function(parentView)
		{
			var oldScope, key, i, l;

			this.parentView = parentView;

			if(!this._isolated)
			{
				oldScope = this.scope || null;
				this.scope = Object.create(parentView.scope);

				if(oldScope)
				{
					var keys = Object.keys(oldScope);
					for(i = 0, l = keys.length; i < l; i++)
					{
						key = keys[i];
						this.scope[key] = oldScope[key];
					}
				}
			}

			if(!this.scope) this.scope = {};

			if(this.subviews !== null)
			{
				for(i = 0, l = this.subviews.length; i < l; i++)
				{
					this.subviews[i]._setParentView(this);
				}
			}
		},

		/**
		 * Rebinds the view to another DOM element
		 *
		 * @private
		 * @param  {DOMELement} element New DOM element of the view
		 */
		_rebindElement: function(element)
		{
			var i, l;

			this.element = element;

			this._rebindSubViews(element, {
				subviewIndex: 0,
				subviewsStructIndex: 0,
				index: 0
			});

			if(this._modelBindersMap)
			{
				this._modelBindersMap.setView(this);
			}

			if(this._collectionBinder)
			{
				this._collectionBinder.view = this;
			}

		},

		_rebindSubViews: function(el, ids)
		{
			var node = el, doSubviews = true;
			var subviews = this.subviews, subviewsStruct = this._subviewsStruct;
			if(subviewsStruct !== null)
			{
				if(subviews === null) this.subviews = subviews = [];

				while((node = nextNode(el, node, doSubviews)) !== null)
				{
					if(subviewsStruct[ids.subviewIndex])
					{
						ids.subviewsStructIndex = subviewsStruct[ids.subviewIndex].index;
						if(ids.index === ids.subviewsStructIndex)
						{
							if(subviews[ids.subviewIndex])
							{
								subviews[ids.subviewIndex]._rebindElement(node);
							}
							ids.subviewIndex++;
							doSubviews = false;
						}
						else doSubviews = true;
					}
					ids.index++;
				}
			}
		},

		/**
		 * Initializes all bindings.
		 *
		 * Parses data-kff-bind attribute of view element and creates appropriate binder objects.
		 */
		_initBinding: function()
		{
			var model, attr, result, result2, modelPathArray, i, ret, modelArgs;
			var dataBindAttr = this.element.getAttribute(settings.DATA_BIND_ATTR);
			var modelName;

			this._modelBindersMap = new BinderMap();

			if(dataBindAttr == null) return;

			var parsedBindings = matchBindings(dataBindAttr);

			if(parsedBindings.match && parsedBindings.match.bindings)
			{
				parsedBindings = parsedBindings.match.bindings;

				for(var i = 0, l = parsedBindings.length; i < l; i++)
				{
					var parsedBinding = parsedBindings[i];

					if(parsedBinding.binder === 'each')
					{
						if(!this.options.isBoundView)
						{
							var animate = null;
							var keyProp = null;
							var alias = null;

							if(parsedBinding.operators)
							{
								for(var j = 0, k = parsedBinding.operators.length; j < k; j++)
								{
									var operator = parsedBinding.operators[j];
									if(operator.args.length >= 1 && operator.args[0].type === 'ident')
									{
										if(operator.name === 'animate') animate = operator.args[0].value;
										if(operator.name === 'key') keyProp = operator.args[0].value;
										if(operator.name === 'as') alias = operator.args[0].value;
									}
								}
							}

							this._collectionBinder = new CollectionBinder({
								view: this,
								keyPath: parsedBinding.keyPath,
								collectionArgs: parsedBinding.modelArgs,
								animate: animate,
								keyProp: keyProp
							});

							if(alias)
							{
								this._itemAlias = alias;
							}
							else this._itemAlias = settings.defaultItemAlias;
						}
					}
					else
					{
						if(!(parsedBinding.binder in View.binders)) break;

						var scope = this.scope;
						var isIdent = function(v){ return v != null && v.type === 'ident'; };
						var identToParser = function(v)
						{
							if(scope[v.value]) return { fn: scope[v.value], args: [] };
							else if(View.helpers[v.value]) return { fn: View.helpers[v.value], args: [] };
						};
						var argToValue = function(v)
						{
							return v.value;
						};
						var isNotNull = function(v)
						{
							return v != null;
						};

						var binderConfig = {
							view: this,
							element: this.element,
							params: parsedBinding.binderArgs.filter(isNotNull),
							keyPath: parsedBinding.keyPath,
							modelArgs: parsedBinding.modelArgs.filter(isNotNull),
							formatters: [],
							parsers: [],
							dispatch: null,
							// dispatchNamedParams: ret.dispatchNamedParams,
							eventNames: [],
							eventFilters: null,
							fill: false,
							nopreventdef: false,
							animate: null,
							indexed: false
						};


						for(var j = 0, k = parsedBinding.operators.length; j < k; j++)
						{
							var operator = parsedBinding.operators[j];
							switch(operator.name)
							{
								case 'format':
								case 'f':
									binderConfig.formatters = operator.args.filter(isIdent).map(identToParser);
									break;
								case 'parse':
								case 'p':
									binderConfig.parsers = operator.args.filter(isIdent).map(identToParser);
									break;
								case 'dispatch':
									if(operator.args.length > 0)
									{
										binderConfig.dispatch = operator.args;
									}
									break;
								case 'on':
									if(operator.args.length > 0)
									{
										binderConfig.eventNames = operator.args.filter(isIdent).map(argToValue);
									}
									break;
								case 'evf':
									binderConfig.eventFilters = operator.args.filter(isIdent).map(identToParser);
									break;
								case 'fill':
									binderConfig.fill = true;
									break;
								case 'nopreventdef':
									binderConfig.nopreventdef = true;
									break;
								case 'animate':
									binderConfig.animate = operator.args[0].value;
									break;
							}
						}

						for(var j = binderConfig.formatters.length - 1; j >= 0; j--)
						{
							if(binderConfig.formatters[j].fn.indexed === true) binderConfig.indexed = true;
						}

						var modelBinder = new View.binders[parsedBinding.binder](binderConfig);

						this._modelBindersMap.add(modelBinder);
					}
				}
			}

			// Check for invalid combination of :each and :if binders:
			

		},

		/**
		 * Destroys all bindings
		 */
		_destroyBinding: function()
		{
			if(this._modelBindersMap)
			{
				this._modelBindersMap.destroyBinders();
				this._modelBindersMap = null;
			}
		},

		/**
		 * Rebinds cursors of all binders that belong to this view
		 *
		 * @private
		 */
		_rebindCursors: function()
		{
			if(this._modelBindersMap) this._modelBindersMap.rebindCursors();
		},

		/**
		 * Refreshes own data-binders
		 *
		 * @private
		 */
		_refreshOwnBinders: function(force)
		{
			if(this._modelBindersMap) this._modelBindersMap.refreshBinders(force);
		}

	});


	(function(){
		var index = function(v, modelName)
		{
			var bindingIndex = this.getBindingIndex(modelName);
			if(bindingIndex !== null) return bindingIndex;
			return v;
		};
		index.indexed = true;
		View.registerHelper('index', index);

		var indexFromOne = function(v, modelName)
		{
			var bindingIndex = this.getBindingIndex(modelName);
			if(bindingIndex !== null) return bindingIndex + 1;
			return v;
		};
		indexFromOne.indexed = true;
		View.registerHelper('indexFromOne', indexFromOne);

	})();


	View.registerHelper('boolean', function(v)
	{
		var parsed = parseInt(v, 10);
		if(!isNaN(parsed)) return !!parsed;
		return v === 'true';
	});

	View.registerHelper('not', function(v)
	{
		return !v;
	});

	View.registerHelper('null', function(v)
	{
		return v === null || v === 'null' ? null : v;
	});

	View.registerHelper('int', function(v)
	{
		v = parseInt(v, 10);
		if(isNaN(v)) v = 0;
		return v;
	});

	View.registerHelper('float', function(v)
	{
		v = parseFloat(v);
		if(isNaN(v)) v = 0;
		return v;
	});

	View.registerHelper('string', function(v)
	{
		return v.toString();
	});

	var Binder = createClass(
	/** @lends Binder.prototype */
	{
		/**
		 * @constructs
		 */
		constructor: function(options)
		{
			this.options = options;
			this.options.events = options.events || null;

			this.view = options.view;
			this.element = options.element;
			this.cursor = null;
			this.keyPath = options.keyPath;
			this.subKeyPath = this.keyPath.slice(1);
			this.rootCursorName = this.keyPath[0];
			this.rootCursor = null;
			this.dispatch = options.dispatch;
			// this.dispatchNamedParams = options.dispatchNamedParams;
			this.currentValue = null;
			this.value = null;
			this.animate = options.animate;
			this.willFill = options.fill;
		},

		/**
		 * Initializes the binder, binds DOM or model events if needed and optionally fetches data from DOM
		 */
		init: function()
		{
			if(!this.options.nobind)
			{
				if(this.element && this.options.events !== null) this.delegateEvents(this.options.events);
			}
			this.rebindCursor();
		},

		/**
		 * Destroys the binder, unbinds any events or model watchers
		 */
		destroy: function()
		{
			if(this.element && this.options.events !== null) this.undelegateEvents(this.options.events);
			this.currentValue = null;
			this.value = null;
		},

		afterRun: function()
		{
			if(this.options.fill)
			{
				this.fill();
				this.willFill = false;
			}
		},

		/**
		 * Delegates events. Using the method from View
		 */
		delegateEvents: View.prototype.delegateEvents,

		/**
		 * Undelegates events. Using the method from View
		 */
		undelegateEvents: View.prototype.undelegateEvents,

		/**
		 * Refreshes the binder whenever the model changes.
		 * @param  {Object} event  Event from the model change
		 * @param  {boolean} force If true, force refreshing even if value does not change
		 */
		modelChange: function(event, force)
		{
			var modelValue, formattedValue;

			modelValue = this.cursor.get();

			if(typeof modelValue === 'function')
			{
				modelValue = callModelAsFunction(this.view, modelValue, this.options.modelArgs.map(this.f(function(arg){
					return this.convertBindingValue(arg);
				})));
			}

			if(modelValue !== 'undefined')
			{
				formattedValue = this.format(modelValue);
				if(!this.willFill && (force || !this.compareValues(formattedValue, this.value)))
				{
					this.value = formattedValue;
					this.currentValue = modelValue;
					this.refresh();
				}
			}
		},

		/**
		 * Simple compare two values using strict equal operator.
		 *
		 * @param  {mixed} value1 Value 1
		 * @param  {mixed} value2 Value 2
		 * @return {boolean}      Result of comparsion
		 */
		compareValues: function(value1, value2)
		{
			return value1 === value2;
		},

		/**
		 * Returns current formatted value of the model prepared to insertion to the DOM
		 *
		 * @return {mixed} Formatted value
		 */
		getFormattedValue: function()
		{
			return this.value;
		},

		/**
		 * Updates model with the value changed by some DOM event
		 *
		 * @param  {mixed} value    Raw unparsed value from the DOM
		 * @param  {DOMEvent} event Original DOM event
		 */
		updateModel: function(value, domEvent)
		{
			var i, l, event;
			this.value = value;
			if(Array.isArray(value))
			{
				for(i = 0, l = value.length; i < l; i++) value[i] = this.parse(value[i]);
			}
			else
			{
				value = this.parse(value);
			}
			if(this.compareValues(value, this.currentValue)) return;

			this.currentValue = value;

			var action = 'set';
			var params = [];

			event = {
				type: 'set',
				cursor: this.cursor,
				value: value,
				domEvent: domEvent,
				params: params
			};

			if(this.dispatch && this.dispatch.length > 0)
			{
				event.type = this.convertBindingValue(this.dispatch[0]);

				for(i = 1, l = this.dispatch.length; i < l; i++)
				{
					var p = this.convertBindingValue(this.dispatch[i]);
					if(p !== null && typeof p === 'object' && 'key' in p)
					{
						event[p.key] = p.value;
					}
					else params.push(p);
				}
			}

			this.view.dispatchEvent(event);
		},

		convertBindingValue: function(value)
		{
			if(value == null) return value;
			switch(value.type)
			{
				case 'ident':
				case 'string':
					return value.value;
				case 'namedParam':
					return {
						key: value.name,
						value: this.convertBindingValue(value.operand)
					};
				case 'cursor':
					return this.view.getCursor(value.keyPath);
				case 'cursorValue':
					var cursor = this.view.getCursor(value.keyPath);
					if(cursor instanceof Cursor) return cursor.get();
					else return undefined;
				default:
					return value.value;
			}
		},

		/**
		 * Process a value from model through formatting pipeline
		 *
		 * @param  {mixed} value The original value from model
		 * @return {mixed}       Formatted value
		 */
		format: function(value)
		{
			var i, l, j, k, value2;
			for(i = 0, l = this.options.formatters.length; i < l; i++)
			{
				if(Array.isArray(value))
				{
					value2 = [];
					for(j = 0, k = value.length; j < k; j++) value2[j] = this.options.formatters[i].fn.apply(this, arrayConcat([value[j]], this.options.formatters[i].args));
					value = value2;
				}
				else value = this.options.formatters[i].fn.apply(this, arrayConcat([value], this.options.formatters[i].args));
			}
			return value;
		},

		/**
		 * Process a value from DOM through parsing pipeline
		 *
		 * @param  {mixed} value The original value from DOM
		 * @return {mixed}       Parsed value
		 */
		parse: function(value)
		{
			var i, l, j, k, value2;
			for(i = 0, l = this.options.parsers.length; i < l; i++)
			{
				if(Array.isArray(value))
				{
					value2 = [];
					for(j = 0, k = value.length; j < k; j++) value2[j] = this.options.parsers[i].fn.apply(this, arrayConcat([value[j]], this.options.parsers[i].args));
					value = value2;
				}
				else value = this.options.parsers[i].fn.apply(this, arrayConcat([value], this.options.parsers[i].args));
			}
			return value;
		},

		/**
		 * Returns binding index of the view in a colelction binding
		 * @param  {string} modelName Model keypath
		 * @return {number}           BInding index
		 */
		getBindingIndex: function(modelName)
		{
			modelName = modelName || this.options.modelName;
			return this.view.getBindingIndex(modelName);
		},

		/**
		 * Create a clone of this object
		 * @return {mixed} Clone of type Binding
		 */
		clone: function()
		{
			return new this.constructor(this.options);
		},

		/**
		 * Refreshes DOM projection of the binding
		 */
		refresh: noop,

		/**
		 * In case of two-way binding, fetches the current binding state/value from the DOM and passes it to
		 * the corresponding model. Most useful for fetching form data into the model.
		 */
		fill: noop,

		/**
		 * Rebinds model event listeners for the actual model retrieved by model keypath.
		 *
		 * @private
		 */
		rebindCursor: function()
		{
			var rootCursor = this.view.scope[this.rootCursorName];
			if(this.rootCursor !== rootCursor)
			{
				this.rootCursor = rootCursor;
				if(rootCursor instanceof Cursor)
				{
					this.cursor = rootCursor.refine(this.subKeyPath);
				}
				else
				{
					this.cursor = new Cursor(rootCursor, this.subKeyPath);
				}
			}
			return this.cursor;
		},

		/**
		 * Returns true if any of formatters uses binding index property.
		 * Used by the binding view to decide which binders need to be refreshed when their binding index changes
		 *
		 * @private
		 * @return {Boolean} True if rendering of the value depends on the binding index
		 */
		isIndexed: function()
		{
			return this.options.indexed;
		},

		/**
		 * Creates a new function that works as event pipeline when event filter is used
		 *
		 * @private
		 * @param  {DOMEvent} originalTriggerEvent Original event
		 * @param  {function} eventFilter          Filter function
		 * @return {function}                      Composed function
		 */
		createFilterTriggerEvent: function(originalTriggerEvent, eventFilter)
		{
			return function(event)
			{
				return eventFilter.fn.apply(this, [originalTriggerEvent, event].concat(eventFilter.args));
			};
		}

	});

	var ModelView = createClass({
		extend: View
	},
	{
		constructor: function(options)
		{
			View.call(this, options);
			this.scope['*'] = new Cursor({});
		}
	});

	var EventBinder = createClass(
	{
		extend: Binder
	},
	/** @lends EventBinder.prototype */
	{
		/**
		 * One-way data binder (DOM to model) for generic DOM event.
		 * Sets model atrribute to defined value when event occurs.
		 * Event defaults to click.
		 *
		 * @constructs
		 * @augments Binder
		 * @param {Object} options Options object
		 */
		constructor: function(options)
		{
			var eventNames = options.eventNames.length > 0 ? options.eventNames.join(' ') : 'click';
			options.events = [
				[eventNames, 'triggerEvent']
			];

			Binder.call(this, options);

			this.userValue = undefined;
			this.valueCursor = undefined;
		},

		init: function()
		{
			this.userValue = null;
			this.valueCursor = undefined;

			if(this.options.params[0])
			{
				this.userValue = this.convertBindingValue(this.options.params[0]);
				if(this.userValue instanceof Cursor)
				{
					this.valueCursor = this.userValue;
					this.userValue = this.valueCursor.get();
				}
			}

			if(this.options.eventFilters && this.options.eventFilters[0])
			{
				this.triggerEvent = this.createFilterTriggerEvent(this.triggerEvent, this.options.eventFilters[0]);
			}
			EventBinder._super.init.call(this);
		},

		triggerEvent: function(event)
		{
			if(!this.options.nopreventdef) event.preventDefault();
			if(this.valueCursor) this.userValue = this.valueCursor.get();
			this.updateModel(this.userValue, event);
		},

		compareValues: function(value1, value2)
		{
			return false;
		}

	});

	View.registerBinder('event', EventBinder);

	var AttrBinder = createClass(
	{
		extend: Binder
	},
	/** @lends AttrBinder.prototype */
	{
		/**
		 * One-way data binder (model to DOM) for an element attribute.
		 * Sets the attribute of the element to defined value when model atrribute changes.
		 *
		 * @constructs
		 * @augments Binder
		 * @param {Object} options Options objectt
		 */
		constructor: function(options)
		{
			Binder.call(this, options);
		},

		init: function()
		{
			this.attribute = this.options.params[0] ? this.convertBindingValue(this.options.params[0]) : null;
			this.prefix = this.options.params[1] ? this.convertBindingValue(this.options.params[1]) : '';
			this.suffix = this.options.params[2] ? this.convertBindingValue(this.options.params[2]) : '';
			AttrBinder._super.init.call(this);
		},

		refresh: function()
		{
			var val = this.value;
			if(val === null || val === undefined) val = '';
			if(this.attribute)
			{
				this.element.setAttribute(this.attribute, this.prefix + val + this.suffix);
			}
		}
	});

	View.registerBinder('attr', AttrBinder);

	var CheckBinder = createClass(
	{
		extend: Binder
	},
	/** @lends CheckBinder.prototype */
	{
		/**
		 * Two-way data binder for checkbox.
		 * Checks input when model atrribute evaluates to true, unchecks otherwise.
		 *
		 * @constructs
		 * @augments Binder
		 * @param {Object} options Options object
		 */
		constructor: function(options)
		{
			var eventNames = options.eventNames.length > 0 ? options.eventNames.join(' ') : 'click';
			options = options || {};
			options.events = [
				[eventNames, 'inputChange']
			];
			Binder.call(this, options);
			if(this.options.fill) this.fillVal = this.element.checked;
			this.equalsTo = undefined;
			this.valueCursor = undefined;
		},

		init: function()
		{
			this.equalsTo = true;
			if(this.options.params[0])
			{
				this.equalsTo = this.convertBindingValue(this.options.params[0]);
				if(this.equalsTo instanceof Cursor)
				{
					this.valueCursor = this.equalsTo;
					this.equalsTo = this.valueCursor.get();
				}
				if(this.equalsTo == null) this.equalsTo = null;
			}
			CheckBinder._super.init.call(this);
		},

		inputChange: function(event)
		{
			this.updateEqualsToValue();
			this.updateModel(this.element.checked ? this.equalsTo : false, event);
		},

		refresh: function()
		{
			this.element.checked = this.matchValue();
		},

		matchValue: function()
		{
			var value = this.value;
			if(value == null) value = null;
			this.updateEqualsToValue();
			return value === this.equalsTo;
		},

		updateEqualsToValue: function()
		{
			if(this.options.params.length > 0)
			{
				if(this.valueCursor)
				{
					this.equalsTo = this.valueCursor.get();
					if(this.equalsTo == null) this.equalsTo = null;
				}
			}
		},

		fill: function()
		{
			if(!this.fillVal) this.fillVal = this.element.checked;
			this.updateModel(this.fillVal);
		}
	});

	View.registerBinder('check', CheckBinder);

	var DisabledBinder = createClass(
	{
		extend: Binder
	},
	/** @lends DisabledBinder.prototype */
	{
		/**
		 * Two-way data binder for checkbox.
		 * Checks input when model atrribute evaluates to true, unchecks otherwise.
		 *
		 * @constructs
		 * @augments Binder
		 * @param {Object} options Options object
		 */
		constructor: function(options)
		{
			Binder.call(this, options);
			this.equalsTo = undefined;
			this.valueCursor = undefined;
		},

		init: function()
		{
			this.equalsTo = true;
			if(this.options.params[0])
			{
				this.equalsTo = this.convertBindingValue(this.options.params[0]);
				if(this.equalsTo instanceof Cursor)
				{
					this.valueCursor = this.equalsTo;
					this.equalsTo = this.valueCursor.get();
				}
				if(this.equalsTo == null) this.equalsTo = null;
			}
			DisabledBinder._super.init.call(this);
		},

		matchValue: function()
		{
			var value = this.value;
			if(value == null) value = null;
			this.updateEqualsToValue();
			return value === this.equalsTo;
		},

		updateEqualsToValue: function()
		{
			if(this.options.params.length > 0)
			{
				if(this.valueCursor)
				{
					this.equalsTo = this.valueCursor.get();
					if(this.equalsTo == null) this.equalsTo = null;
				}
			}
		},

		refresh: function()
		{
			this.element.disabled = this.matchValue();
		},

		fill: function()
		{
			if(!this.fillVal) this.fillVal = this.element.disabled ? this.equalsTo : false;
			this.updateModel(this.fillVal);
		}

	});

	View.registerBinder('disabled', DisabledBinder);

	var DisabledNotBinder = createClass(
	{
		extend: Binder
	},
	/** @lends DisabledNotBinder.prototype */
	{
		/**
		 * Two-way data binder for checkbox.
		 * Checks input when model atrribute evaluates to true, unchecks otherwise.
		 *
		 * @constructs
		 * @augments Binder
		 * @param {Object} options Options object
		 */
		constructor: function(options)
		{
			Binder.call(this, options);
			this.equalsTo = undefined;
			this.valueCursor = undefined;
		},

		init: function()
		{
			this.equalsTo = true;
			if(this.options.params[0])
			{
				this.equalsTo = this.convertBindingValue(this.options.params[0]);
				if(this.equalsTo instanceof Cursor)
				{
					this.valueCursor = this.equalsTo;
					this.equalsTo = this.valueCursor.get();
				}
				if(this.equalsTo == null) this.equalsTo = null;
			}
			DisabledNotBinder._super.init.call(this);
		},

		matchValue: function()
		{
			var value = this.value;
			if(value == null) value = null;
			this.updateEqualsToValue();
			return value !== this.equalsTo;
		},

		updateEqualsToValue: function()
		{
			if(this.options.params.length > 0)
			{
				if(this.valueCursor)
				{
					this.equalsTo = this.valueCursor.get();
					if(this.equalsTo == null) this.equalsTo = null;
				}
			}
		},

		refresh: function()
		{
			this.element.disabled = this.matchValue();
		},

		fill: function()
		{
			if(!this.fillVal) this.fillVal = this.element.disabled ? false : this.equalsTo;
			this.updateModel(this.fillVal);
		}
	});

	View.registerBinder('disablednot', DisabledNotBinder);

	var StyleBinder = createClass(
	{
		extend: Binder
	},
	/** @lends StyleBinder.prototype */
	{
		/**
		 * One-way data binder (model to DOM) for any CSS style property.
		 * Sets the CSS property of the element to defined value when model atrribute changes.
		 *
		 * @constructs
		 * @augments Binder
		 * @param {Object} options Options objectt
		 */
		constructor: function(options)
		{
			Binder.call(this, options);
		},

		init: function()
		{
			this.styleProperty = this.options.params[0] ? this.convertBindingValue(this.options.params[0]) : null;
			this.styleUnit = this.options.params[1] ? this.convertBindingValue(this.options.params[1]) : '';
			StyleBinder._super.init.call(this);
		},

		refresh: function()
		{
			var value = this.value;

			if(this.styleProperty)
			{
				if(value === undefined) delete this.element.style[this.styleProperty];
				else
				{
					if(this.styleUnit) value += this.styleUnit;
					try {
						this.element.style[this.styleProperty] = value;
					}
					catch(e) {}
				}
			}
		}
	});

	View.registerBinder('style', StyleBinder);

	var ClickBinder = createClass(
	{
		extend: EventBinder
	},
	/** @lends ClickBinder.prototype */
	{
		/**
		 * One-way data binder (DOM to model) for click event.
		 * Sets model atrribute to defined value when click event occurs.
		 *
		 * @constructs
		 * @augments Binder
		 * @param {Object} options Options object
		 */
		constructor: function(options)
		{
			if(options.eventNames.length === 0)	options.eventNames = ['click'];
			EventBinder.call(this, options);
		}

	});

	View.registerBinder('click', ClickBinder);

	var DoubleClickBinder = createClass(
	{
		extend: EventBinder
	},
	/** @lends DoubleClickBinder.prototype */
	{
		/**
		 * One-way data binder (DOM to model) for double click event.
		 * Sets model atrribute to defined value when dblclick event occurs.
		 *
		 * @constructs
		 * @augments Binder
		 * @param {Object} options Options object
		 */
		constructor: function(options)
		{
			if(options.eventNames.length === 0)	options.eventNames = ['dblclick'];
			EventBinder.call(this, options);
		}

	});

	View.registerBinder('dblclick', DoubleClickBinder);

	var FocusBinder = createClass(
	{
		extend: EventBinder
	},
	/** @lends FocusBinder.prototype */
	{
		/**
		 * One-way data binder (DOM to model) for focus event.
		 * Sets model atrribute to defined value when element gets focus.
		 *
		 * @constructs
		 * @augments EventBinder
		 * @param {Object} options Options object
		 */
		constructor: function(options)
		{
			if(options.eventNames.length === 0)	options.eventNames = ['focus'];
			EventBinder.call(this, options);
		}

	});

	View.registerBinder('focus', FocusBinder);

	var BlurBinder = createClass(
	{
		extend: EventBinder
	},
	/** @lends BlurBinder.prototype */
	{
		/**
		 * One-way data binder (DOM to model) for blur event.
		 * Sets model atrribute to defined value when element looses focus.
		 *
		 * @constructs
		 * @augments EventBinder
		 * @param {Object} options Options object
		 */
		constructor: function(options)
		{
			if(options.eventNames.length === 0)	options.eventNames = ['blur'];
			EventBinder.call(this, options);
		}

	});

	View.registerBinder('blur', BlurBinder);

	var FocusBlurBinder = createClass(
	{
		extend: EventBinder
	},
	/** @lends FocusBlurBinder.prototype */
	{
		/**
		 * Two-way data binder for focus/blur event.
		 * Sets model atrribute to true when element gets focus or to false when it looses focus.
		 * Also triggers focus/blur event on attribute change.
		 * Values are passed throught eventual parsers/formatters of course.
		 *
		 * @constructs
		 * @augments EventBinder
		 * @param {Object} options Options object
		 */
		constructor: function(options)
		{
			if(options.eventNames.length === 0)	options.eventNames = ['focus blur'];
			EventBinder.call(this, options);
		},

		triggerEvent: function(event)
		{
			this.updateModel(this.view.env.document.activeElement === this.element, event);
		},

		refresh: function()
		{
			if(this.value)
			{
				if(this.view.env.document.activeElement !== this.element) this.element.focus();
			}
			else
			{
				if(this.view.env.document.activeElement === this.element) this.element.blur();
			}
		}
	});

	View.registerBinder('focusblur', FocusBlurBinder);

	var HtmlBinder = createClass(
	{
		extend: Binder
	},
	/** @lends HtmlBinder.prototype */
	{
		/**
		 * One-way data binder for html content of the element.
		 * Renders html content of the element on change of the bound model attribute.
		 *
		 * @constructs
		 * @augments Binder
		 * @param {Object} options Options object
		 */
		constructor: function(options)
		{
			Binder.call(this, options);
		},

		refresh: function()
		{
			var val = this.value;
			if(val === null || val === undefined) val = '';
			this.element.innerHTML = val;
		}
	});

	View.registerBinder('html', HtmlBinder);

	var RadioBinder = createClass(
	{
		extend: Binder
	},
	/** @lends RadioBinder.prototype */
	{
		/**
		 * Two-way data binder for radio button.
		 * Checks radio when model atrribute evaluates to true, unchecks otherwise.
		 *
		 * @constructs
		 * @augments Binder
		 * @param {Object} options Options object
		 */
		constructor: function(options)
		{
			var eventNames = options.eventNames.length > 0 ? options.eventNames.join(' ') : 'click';
			options = options || {};
			options.events = [
				[eventNames, 'inputChange']
			];
			Binder.call(this, options);
			if(this.options.fill) this.fillVal = this.element.checked;
		},

		inputChange: function(event)
		{
			if(this.element.checked)
			{
				this.updateModel(this.element.value, event);
			}
		},

		refresh: function()
		{
			this.element.checked = this.parse(this.element.value) === this.currentValue;
		},

		fill: function()
		{
			if(!this.fillVal) this.fillVal = this.element.checked;
			if(this.fillVal)
			{
				this.updateModel(this.element.value);
			}
		}

	});

	View.registerBinder('radio', RadioBinder);

	var TextBinder = createClass(
	{
		extend: Binder
	},
	/** @lends TextBinder.prototype */
	{
		/**
		 * One-way data binder for plain text content of the element.
		 * Renders text content of the element on change of the bound model attribute.
		 *
		 * @constructs
		 * @augments Binder
		 * @param {Object} options Options object
		 */
		constructor: function(options)
		{
			Binder.call(this, options);
			this.prefix = '';
			this.suffix = '';

			options.params.forEach(this.f(function(param)
			{
				if(param.type === 'namedParam')
				{
					if(param.name === 'prefix')
					{
						this.prefix = param.operand.value;
					}
					else if(param.name === 'suffix')
					{
						this.suffix = param.operand.value;
					}
				}
			}));
		},

		refresh: function(value)
		{
			var val = this.value;
			if(val === null || val === undefined) val = '';
			val = this.prefix + val + this.suffix;
			this.element.textContent = val;
		}
	});

	if(typeof document === 'object' && document !== null)
	{
		if(!('textContent' in document.documentElement))
		{
			TextBinder.prototype.refresh = function(value)
			{
				var val = this.value;
				if(val === null || val === undefined) val = '';
				val = this.prefix + val + this.suffix;
				this.element.innerText = val;
			};
		}
	}

	View.registerBinder('text', TextBinder);

	var ValueBinder = createClass(
	{
		extend: Binder
	},
	/** @lends ValueBinder.prototype */
	{
		/**
		 * Two-way data binder for input, select, textarea elements.
		 * Triggers model change on keydown, drop and change events on default.
		 *
		 * @constructs
		 * @augments Binder
		 * @param {Object} options Options object
		 */
		constructor: function(options)
		{
			var eventNames = options.eventNames.length > 0 ? options.eventNames.join(' ') : 'keypress keydown drop change';
			options.events = [
				[eventNames, 'inputChange']
			];
			this.multiple = false;
			Binder.call(this, options);
			if(this.options.fill) this.fillVal = this.getValue();
		},

		init: function()
		{
			this.multiple = this.element.nodeName === 'SELECT' && this.element.multiple;
			if(this.multiple)
			{
				this.getValue = this.getArrayValue;
				this.setValue = this.setArrayValue;
				this.compareValues = compareArrays;
			}
			if(this.options.eventFilters && this.options.eventFilters[0])
			{
				this.inputChange = this.createFilterTriggerEvent(this.inputChange, this.options.eventFilters[0]);
			}
			Binder.prototype.init.call(this);
		},

		inputChange: function(event)
		{
			setImmediate$1(this.f(function()
			{
				this.updateModel(this.getValue(), event);
			}));
		},

		refresh: function()
		{
			var val = this.getFormattedValue();
			if(val === null || val === undefined) val = '';

			if(this.element.nodeName === 'SELECT')
			{
				setImmediate$1(this.f(function()
				{
					this.setValue(val);
				}));
			}
			else
			{
				this.setValue(val);
			}
		},

		fill: function()
		{
			if(!this.fillVal)
			{
				this.fillVal = this.getValue();
			}
			this.updateModel(this.fillVal);
		},

		getValue: function()
		{
			return this.element.value;
		},

		setValue: function(val)
		{
			if(val == '' || this.element.type !== 'file') this.element.value = val;
		},

		getArrayValue: function()
		{
			var result = [];
			var options = this.element && this.element.options;
			var option;

			for(var i = 0, l = options.length; i < l; i++)
			{
				option = options[i];
				if(option.selected)
				{
					result.push(option.value || option.text);
				}
			}
			return result;
		},

		setArrayValue: function(val)
		{
			if(!Array.isArray(val)) val = [val];
			var options = this.element && this.element.options;
			var option;

			for(var i = 0, l = options.length; i < l; i++)
			{
				option = options[i];
				option.selected = arrayIndexOf(val, this.parse(option.value)) !== -1;
			}
		}
	});

	View.registerBinder('val', ValueBinder);

	var TextAppendBinder = createClass(
	{
		extend: Binder
	},
	/** @lends TextBinder.prototype */
	{
		/**
		 * One-way data binder for plain text node appended to the element.
		 *
		 * @constructs
		 * @augments Binder
		 * @param {Object} options Options object
		 */
		constructor: function(options)
		{
			Binder.call(this, options);
			this.appendedTextNode = null;
			this.addWhiteSpace = false;
			this.prefix = '';
			this.suffix = '';

			options.params.forEach(this.f(function(param){
				if(param.type === 'namedParam')
				{
					if(param.name === 'ws' && param.operand.value === true)
					{
						this.addWhiteSpace = true;
					}
					else if(param.name === 'prefix')
					{
						this.prefix = param.operand.value;
					}
					else if(param.name === 'suffix')
					{
						this.suffix = param.operand.value;
					}
				}
			}));
		},

		destroy: function()
		{
			this.appendedTextNode = null;
			TextAppendBinder._super.destroy.call(this);
		},

		refresh: function(value)
		{
			var val = this.value;
			if(val === null || val === undefined) val = '';

			val = this.prefix + val + this.suffix;

			if(val !== '' && this.addWhiteSpace) val = ' ' + val;

			if(this.appendedTextNode) this.appendedTextNode.textContent = val;
			else
			{
				this.appendedTextNode = document.createTextNode(val);
				this.element.appendChild(this.appendedTextNode);
			}
		}
	});

	View.registerBinder('textappend', TextAppendBinder);

	var TextPrependBinder = createClass(
	{
		extend: Binder
	},
	/** @lends TextBinder.prototype */
	{
		/**
		 * One-way data binder for plain text node prepended to the element.
		 *
		 * @constructs
		 * @augments Binder
		 * @param {Object} options Options object
		 */
		constructor: function(options)
		{
			Binder.call(this, options);
			this.prependedTextNode = null;
			this.addWhiteSpace = false;
			this.prefix = '';
			this.suffix = '';

			options.params.forEach(this.f(function(param)
			{
				if(param.type === 'namedParam')
				{
					if(param.name === 'ws' && param.operand.value === true)
					{
						this.addWhiteSpace = true;
					}
					else if(param.name === 'prefix')
					{
						this.prefix = param.operand.value;
					}
					else if(param.name === 'suffix')
					{
						this.suffix = param.operand.value;
					}
				}
			}));
		},

		destroy: function()
		{
			this.prependedTextNode = null;
			TextPrependBinder._super.destroy.call(this);
		},

		refresh: function(value)
		{
			var val = this.value;
			if(val === null || val === undefined) val = '';

			val = this.prefix + val + this.suffix;

			if(val !== '' && this.addWhiteSpace) val = val + ' ';

			if(this.prependedTextNode) this.prependedTextNode.textContent = val;
			else
			{
				this.prependedTextNode = document.createTextNode(val);
				this.element.insertBefore(this.prependedTextNode, this.element.firstChild);
			}
		}
	});

	View.registerBinder('textprepend', TextPrependBinder);

	var createClassBinder = function(negate)
	{
		var ClassBinder = createClass(
		{
			extend: Binder
		},
		/** @lends ClassBinder.prototype */
		{
			/**
			 * One-way data binder (model to DOM) for CSS class.
			 * Sets/Unsets the class of the element to some predefined value when model atrribute changes.
			 *
			 * @constructs
			 * @augments Binder
			 * @param {Object} options Options objectt
			 */
			constructor: function(options)
			{
				Binder.call(this, options);

				this.className = undefined;
				this.equalsTo = undefined;
				this.valueCursor = undefined;
			},

			init: function()
			{
				this.className = this.convertBindingValue(this.options.params[0]) || null;
				this.equalsTo = true;
				this.valueCursor = undefined;

				if(this.options.params[1])
				{
					this.equalsTo = this.convertBindingValue(this.options.params[1]);
					if(this.equalsTo instanceof Cursor)
					{
						this.valueCursor = this.equalsTo;
						this.equalsTo = this.valueCursor.get();
					}
					if(this.equalsTo == null) this.equalsTo = null;
				}

				this.negate = this.options.params[2] === 'ne' || negate;

				ClassBinder._super.init.call(this);
			},

			refresh: function()
			{
				if(this.className)
				{
					if(this.matchValue())
					{
						if(this.animate)
						{
							this.view.scope[this.animate]['addClass'](this.element, this.className);
						}
						else
						{
							this.element.classList.add(this.className);
						}
					}
					else
					{
						if(this.animate)
						{
							this.view.scope[this.animate]['removeClass'](this.element, this.className);
						}
						else
						{
							this.element.classList.remove(this.className);
						}
					}
				}
			},

			matchValue: function()
			{
				var value = this.value;
				if(value == null) value = null;
				if(this.options.params.length > 1)
				{
					if(this.valueCursor)
					{
						this.equalsTo = this.valueCursor.get();
						if(this.equalsTo == null) this.equalsTo = null;
					}
					if(negate) return value !== this.equalsTo;
					else return value === this.equalsTo;
				}
				if(negate) return !value;
				else return !!value;
			}
		});

		return ClassBinder;

	};

	var ClassBinder = createClassBinder(false);
	var ClassNotBinder = createClassBinder(true);

	View.registerBinder('class', ClassBinder);
	View.registerBinder('classnot', ClassNotBinder);

	var createInsertBinder = function(negate, force){

		return createClass(
		{
			extend: Binder
		},
		/** @lends InsertBinder.prototype */
		{
			/**
			 * One-way data binder (model to DOM) for inserting/removing element from DOM.
			 *
			 * @constructs
			 * @augments Binder
			 * @param {Object} options Options objectt
			 */
			constructor: function(options)
			{
				Binder.call(this, options);
				this.equalsTo = undefined;
				this.valueCursor = undefined;
				this.isInitialized = false;
				this.isRendered = false;
			},

			init: function()
			{
				this.equalsTo = true;
				this.valueCursor = undefined;

				if(this.options.params[0])
				{
					this.equalsTo = this.convertBindingValue(this.options.params[0]);
					if(this.equalsTo instanceof Cursor)
					{
						this.valueCursor = this.equalsTo;
						this.equalsTo = this.valueCursor.get();
					}
					if(this.equalsTo == null) this.equalsTo = null;
				}

				this.isInserted = true;

				if(force)
				{
					this.isRun = false;
					this.isRendered = true;

					this.renderSubviews = this.view.renderSubviews;
					this.runSubviews = this.view.runSubviews;
					this.afterRunSubviews = this.view.afterRunSubviews;
					this.destroySubviews = this.view.destroySubviews;

					this.view.renderSubviews = noop;
					this.view.runSubviews = noop;
					this.view.afterRunSubviews = noop;
					this.view.destroySubviews = noop;
				}

				Binder.prototype.init.call(this);

				this.isInitialized = true;
			},

			destroy: function()
			{
				if(!this.isInitialized) return;
				if(force)
				{
					this.view.renderSubviews = this.renderSubviews;
					this.view.runSubviews = this.runSubviews;
					this.view.afterRunSubviews = this.afterRunSubviews;
					this.view.destroySubviews = this.destroySubviews;
				}
				if(!this.isInserted && this.anchor)
				{
					var parentNode = this.anchor.parentNode;

					if(parentNode)
					{
						parentNode.replaceChild(this.element, this.anchor);
					}
					this.isInserted = true;
				}
				this.anchor = null;
				this.isInitialized = false;
				this.isRendered = false;

				Binder.prototype.destroy.call(this);
			},

			refresh: function()
			{
				if(!this.isInitialized) return;
				var parentNode;
				if(!this.anchor)
				{
					this.anchor = this.view.env.document.createTextNode('');
					this.element.parentNode.insertBefore(this.anchor, this.element);
				}

				var nodeInsert = insertBefore;
				var nodeRemove = removeChild;

				if(this.animate)
				{
					nodeInsert = this.view.scope[this.animate]['insert'];
					nodeRemove = this.view.scope[this.animate]['remove'];
				}

				if(this.matchValue())
				{
					if(force)
					{
						if(!this.isRendered)
						{
							this.renderSubviews.call(this.view);
							this.isRendered = true;
						}
						if(!this.isRun)
						{
							this.runSubviews.call(this.view);
							this.afterRunSubviews.call(this.view);
							this.isRun = true;
						}
					}
					if(!this.isInserted)
					{
						parentNode = this.anchor.parentNode;

						if(parentNode)
						{
							nodeInsert(parentNode, this.anchor, this.element);
							this.isInserted = true;
						}
					}
				}
				else
				{
					if(this.isInserted)
					{
						parentNode = this.element.parentNode;

						if(parentNode)
						{
							var removeFn = this.isRun ? nodeRemove : removeChild;

							removeFn(parentNode, this.element, this.f(function()
							{
								if(force && this.isRendered)
								{
									this.destroySubviews.call(this.view);
									this.isRendered = false;
									this.isRun = false;
								}
								this.isInserted = false;
							}));
							this.isInserted = false;
						}
					}
					else if(force && this.isRendered)
					{
						this.destroySubviews.call(this.view);
						this.isRendered = false;
						this.isRun = false;
					}
				}
			},

			matchValue: function()
			{
				var value = this.value;
				if(value == null) value = null;
				if(this.options.params.length > 0)
				{
					if(this.valueCursor)
					{
						this.equalsTo = this.valueCursor.get();
						if(this.equalsTo == null) this.equalsTo = null;
					}
					if(negate) return value !== this.equalsTo;
					else return value === this.equalsTo;
				}
				if(negate) return !value;
				else return !!value;
			}
		});

	};

	var IfBinder = createInsertBinder(false, true);
	var IfNotBinder = createInsertBinder(true, true);

	View.registerBinder('if', IfBinder);
	View.registerBinder('ifnot', IfNotBinder);



	var kff$1 = Object.freeze({
		parser: parseBinding,
		settings: settings,
		arrayConcat: arrayConcat,
		arrayIndexOf: arrayIndexOf,
		compareArrays: compareArrays,
		bindFn: bindFn,
		createClass: createClass,
		deepMixins: deepMixins,
		extend: extend,
		isPlainObject: isPlainObject,
		log: log,
		mixins: mixins,
		setImmediate: setImmediate$1,
		curry: curry,
		compose: compose,
		map: map,
		imclone: imclone,
		imset: imset,
		imremove: imremove,
		immerge: immerge,
		noop: noop,
		afterRepaint: afterRepaint,
		viewClassFactory: viewClassFactory,
		Cursor: Cursor,
		EventStream: EventStream,
		View: View,
		BinderMap: BinderMap,
		Binder: Binder,
		CollectionBinder: CollectionBinder,
		ModelView: ModelView,
		Dispatcher: Dispatcher,
		EventBinder: EventBinder,
		AttrBinder: AttrBinder,
		CheckBinder: CheckBinder,
		DisabledBinder: DisabledBinder,
		DisabledNotBinder: DisabledNotBinder,
		StyleBinder: StyleBinder,
		ClickBinder: ClickBinder,
		DoubleClickBinder: DoubleClickBinder,
		FocusBinder: FocusBinder,
		BlurBinder: BlurBinder,
		FocusBlurBinder: FocusBlurBinder,
		HtmlBinder: HtmlBinder,
		RadioBinder: RadioBinder,
		TextBinder: TextBinder,
		ValueBinder: ValueBinder,
		TextAppendBinder: TextAppendBinder,
		TextPrependBinder: TextPrependBinder,
		ClassBinder: ClassBinder,
		ClassNotBinder: ClassNotBinder,
		IfBinder: IfBinder,
		IfNotBinder: IfNotBinder
	});

	return kff$1;

})));
