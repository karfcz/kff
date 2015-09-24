if (!Function.prototype.bind) {
  Function.prototype.bind = function(oThis) {
    if (typeof this !== 'function') {
      // closest thing possible to the ECMAScript 5
      // internal IsCallable function
      throw new TypeError('Function.prototype.bind - what is trying to be bound is not callable');
    }

    var aArgs   = Array.prototype.slice.call(arguments, 1),
        fToBind = this,
        fNOP    = function() {},
        fBound  = function() {
          return fToBind.apply(this instanceof fNOP
                 ? this
                 : oThis,
                 aArgs.concat(Array.prototype.slice.call(arguments)));
        };

    if (this.prototype) {
      // native functions don't have a prototype
      fNOP.prototype = this.prototype;
    }
    fBound.prototype = new fNOP();

    return fBound;
  };
}


function emitEvent(el, eventName, eventType)
{
    var event;

    event = document.createEvent(eventType || 'Event');
    event.initEvent("click", true, true);
    el.dispatchEvent(event);

    // if (document.createEvent) {
    //     event = new Event(eventName);
    //     el.dispatchEvent(event);
    // } else {
    //     event = document.createEventObject();
    //     el.fireEvent('on' + eventName, event);
    // }
};
