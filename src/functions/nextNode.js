
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
export default function nextNode(root, node, deep)
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
