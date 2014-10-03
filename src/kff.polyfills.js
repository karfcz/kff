// EventListener | @jon_neal | //github.com/jonathantneal/EventListener

if(typeof window === 'object' && window !== null)
{
	(function(){

		!this.addEventListener && this.Element && (function () {
			function addToPrototype(name, method) {
				Window.prototype[name] = HTMLDocument.prototype[name] = Element.prototype[name] = method;
			}

			var registry = [];

			addToPrototype("addEventListener", function (type, listener) {
				var target = this;

				registry.unshift({
					__listener: function (event) {
						event.currentTarget = target;
						event.pageX = event.clientX + document.documentElement.scrollLeft;
						event.pageY = event.clientY + document.documentElement.scrollTop;
						event.preventDefault = function () { event.returnValue = false };
						if(event.type === 'mouseleave' || event.type === 'mouseout') {
							event.relatedTarget = event.toElement || null;
						}
						else {
							event.relatedTarget = event.fromElement || null;
						}
						event.stopPropagation = function () { event.cancelBubble = true };
						event.target = event.srcElement || target;
						event.timeStamp = +new Date;

						listener.call(target, event);
					},
					listener: listener,
					target: target,
					type: type
				});

				this.attachEvent("on" + type, registry[0].__listener);
			});

			addToPrototype("removeEventListener", function (type, listener) {
				for (var index = 0, length = registry.length; index < length; ++index) {
					if (registry[index].target == this && registry[index].type == type && registry[index].listener == listener) {
						return this.detachEvent("on" + type, registry.splice(index, 1)[0].__listener);
					}
				}
			});

			addToPrototype("dispatchEvent", function (eventObject) {
				try {
					return this.fireEvent("on" + eventObject.type, eventObject);
				} catch (error) {
					for (var index = 0, length = registry.length; index < length; ++index) {
						if (registry[index].target == this && registry[index].type == eventObject.type) {
							registry[index].call(this, eventObject);
						}
					}
				}
			});
		})();

	})();


	// ClassList polyfill for IE8/9
	(function () {

		if (typeof window.Element === "undefined" || "classList" in document.documentElement) return;

		var prototype = Array.prototype,
			push = prototype.push,
			splice = prototype.splice,
			join = prototype.join;

		function DOMTokenList(el) {
			this.el = el;
			// The className needs to be trimmed and split on whitespace
			// to retrieve a list of classes.
			var classes = el.className.replace(/^\s+|\s+$/g,'').split(/\s+/);
			for (var i = 0; i < classes.length; i++) {
				push.call(this, classes[i]);
			}
		};

		DOMTokenList.prototype =
		{
			add: function(token) {
				if(this.contains(token)) return;
				push.call(this, token);
				this.el.className = this.toString();
			},

			contains: function(token) {
				return this.el.className.indexOf(token) != -1;
			},

			item: function(index) {
				return this[index] || null;
			},

			remove: function(token) {
				if (!this.contains(token)) return;
					for (var i = 0; i < this.length; i++) {
						if (this[i] == token) break;
					}
					splice.call(this, i, 1);
				this.el.className = this.toString();
			},

			toString: function() {
				return join.call(this, ' ');
			},

			toggle: function(token) {
				if (!this.contains(token)) {
					this.add(token);
				} else {
					this.remove(token);
				}

				return this.contains(token);
			}
		};

		window.DOMTokenList = DOMTokenList;

		function defineElementGetter (obj, prop, getter) {
			if (Object.defineProperty) {
				Object.defineProperty(obj, prop,{
					get : getter
				});
			} else {
				obj.__defineGetter__(prop, getter);
			}
		}

		defineElementGetter(Element.prototype, 'classList', function () {
			return new DOMTokenList(this);
		});

	})();

}