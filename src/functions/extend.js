
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

export default extend;
