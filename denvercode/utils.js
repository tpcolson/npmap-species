var subNavZ, headerZ, divHeader, divSubNav,
	fullscreen = false;

function enterfullscreen() {
	headerZ = divHeader.style.zIndex;
	subNavZ = divSubNav.style.zIndex;
	divHeader.style.zIndex = 0;
	divSubNav.style.zIndex = 0;
}

function exitfullscreen() {
	divHeader.style.zIndex = headerZ;
	divSubNav.style.zIndex = subNavZ;
}

function toggle() {
	if(fullscreen) {
		fullscreen = false;
		exitfullscreen();
	} else {
		fullscreen = true;
		enterfullscreen();
	}
}

window.onload = function() {
	divHeader = document.getElementById('header');
	divSubNav = document.getElementById('sub-nav');

	var fsButton = document.getElementsByClassName('fullscreen enter')[0];

	fsButton.addEventListener('click', toggle, false);
}

function setLegend() {
	var html = '<center><h1>Show Layer?</h1></center>';
	html += '<input type=\'checkbox\' checked=true onchange=\'toggleVisibility(NPMap.config.baseLayers);\' /> ' + 'Base Layer' + '<br>';

	var overlays = NPMap.config.overlays;
	for (var i = 0; i < overlays.length; i++) {
		html += '<input type=\'checkbox\' checked=true onchange=\'toggleVisibility("overlay-' + i + '");\' /> ' + overlays[i].name + '<br>';
	}
	return html;
}

var obsVisible = true;
function toggleVisibility(layer) {
	if(layer === NPMap.config.baseLayers) {
		if(layer[0].L.options.opacity === 1) layer[0].L.setOpacity(0);
		else layer[0].L.setOpacity(1);
	} else {
		var i = parseInt(layer.split('-')[1]);
		var _layer = NPMap.config.overlays[i];

		if(_layer.type === 'geojson') {
			/* couldn't get geojsons setopacity to work, so I just remove and add back the layer (a bit slower, but not too bad so who cares) */
			if(obsVisible) {
				obsVisible = false;
				NPMap.config.L.removeLayer(_layer.L);
			} else {
				obsVisible = true;
				NPMap.config.L.addLayer(_layer.L);
			}
		} else {
			if(_layer.L.options.opacity === 1) _layer.L.setOpacity(0);
			else _layer.L.setOpacity(1);
		}
	}
}
