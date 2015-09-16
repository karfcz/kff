
function insertBefore(parentNode, anchorNode, node)
{
	if(parentNode)
	{
		parentNode.insertBefore(node, anchorNode);
	}
}

function removeChild(parentNode, node)
{
	if(parentNode)
	{
		parentNode.removeChild(node);
	}
}

module.exports = {
	insertBefore: insertBefore,
	removeChild: removeChild
};
