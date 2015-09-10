
var createClass = require('./functions/createClass');
var EventsMixin = require('./EventsMixin');
var $ = require('./dollar');

var HashStateHandler = createClass(
{
	mixins: EventsMixin,
	shared: true
},
/** @lends StateHandler.prototype */
{
	init: function()
	{
		this.stateHistory = {};
		this.initialHash = location.hash;
		$(window).on('hashchange', this.f('hashChange'));
		this.hashChange();
	},

	destroy: function()
	{
		$(window).off('hashchange', this.f('hashChange'));
	},

	pushState: function(state, title, url)
	{
		location.hash = url;
	},

	replaceState: function(state, title, url)
	{
		if(location.hash !== this.initialHash) history.back();
		location.hash = url;
	},

	hashChange: function(event)
	{
		var hash = location.hash;
		if(hash.indexOf('#') !== 0 && hash != '') return false;

		this.trigger('popstate', { path: hash, params: {} });
		return false;
	}
});

module.exports = HashStateHandler;
