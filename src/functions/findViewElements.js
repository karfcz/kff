import nextNode from './nextNode.js';
import settings from '../settings.js';

/**
 * Finds possible subview elements inside an element
 *
 * @param  {DOM Element} el Root element from which search starts
 * @return {Object} array of found views metadata {viewName, index, element, options}
 */
export default function findViewElements(el)
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

