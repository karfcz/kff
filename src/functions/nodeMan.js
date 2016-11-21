
export function insertBefore(parentNode, anchorNode, node)
{
	if(parentNode)
	{
		parentNode.insertBefore(node, anchorNode);
	}
}

export function removeChild(parentNode, node, fn)
{
	if(parentNode)
	{
		parentNode.removeChild(node);
	}
	fn();
}
