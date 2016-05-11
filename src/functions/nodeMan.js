
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

module.exports = {
	insertBefore: insertBefore,
	removeChild: removeChild
};
