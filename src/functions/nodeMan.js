
var tim = 0;

function afterRepaint(fn)
{
	var requestAnimationFrame = window.requestAnimationFrame || function(fn){ setTimeout(fn, 1000/60); };
	requestAnimationFrame(function()
	{
		setTimeout(fn, 0);
	});
}

function insertBefore(parentNode, anchorNode, node)
{
	parentNode.insertBefore(node, anchorNode);
	// tim += 200;
	// node.classList.add('beforeAdd');
	// if(parentNode)
	// {
	// 	parentNode.insertBefore(node, anchorNode);

	// 	afterRepaint(function(){
	// 		node.classList.add('afterAdd');
	// 		node.classList.remove('beforeAdd');
	// 	});

	// }
	// setTimeout(function(){

	// }, tim)

}

function removeChild(parentNode, node)
{
	if(parentNode){
		parentNode.removeChild(node);
	}
	// tim += 1000;
	setTimeout(function(){
	}, tim);
}

module.exports = {
	insertBefore: insertBefore,
	removeChild: removeChild
};
