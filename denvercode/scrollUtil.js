/* these functions are taken from NPMap.js */

function utilGetPosition (el) {
	var obj = {
		left: 0,
		top: 0
	},
		offset = utilGetOffset(el),
		offsetParent = utilGetOffset(el.parentNode);

	obj.left = offset.left - offsetParent.left;
	obj.top = offset.top - offsetParent.top;

	return obj;
}

function utilGetOffset (el) {
	for (var lx = 0, ly = 0; el !== null; lx += el.offsetLeft, ly += el.offsetTop, el = el.offsetParent);

	return {
		left: lx,
		top: ly
	};
}

function utilGetOuterDimensions (el) {
	var height = 0,
		width = 0;

	if (el) {
		var changed = [],
			parentNode = el.parentNode;

		utilCheckDisplay(el, changed);

		if (el.id !== 'npmap' && parentNode) {
			utilCheckDisplay(parentNode, changed);

			while (parentNode.id && parentNode.id !== 'npmap' && parentNode.id !== 'npmap-map') {
				parentNode = parentNode.parentNode;

				if (parentNode) {
					utilCheckDisplay(parentNode, changed);
				}
			}
		}

		height = el.offsetHeight;
		width = el.offsetWidth;

		changed.reverse();

		for (var i = 0; i < changed.length; i++) {
			changed[i].style.display = 'none';
		}
	}

	return {
		height: height,
		width: width
	};
}

function utilCheckDisplay (node, changed) {
	if (node.style && node.style.display === 'none') {
		changed.push(node);
		node.style.display = 'block';
	}
}
