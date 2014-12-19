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

var switcher, selected;
window.onload = function() {
	divHeader = document.getElementById('header');
	divSubNav = document.getElementById('sub-nav');

	var fsButton = document.getElementsByClassName('fullscreen enter')[0];

	fsButton.addEventListener('click', toggle, false);

	switcher = document.getElementById('basemap_listbox');
	selected = switcher.getElementsByClassName('selected')[0];
	switcher.addEventListener('click', checkBase);
}

function checkBase() {
	var newSelected = switcher.getElementsByClassName('selected')[0];
	if(newSelected !== selected) {
		baseVisible = true;
		selected = newSelected;
		document.getElementById('baseToggle').checked = true;
	}
}

function setLegend() {
	var html = '<center><h1>Show Layer?</h1></center>';
	html += '<input id=\'baseToggle\' type=\'checkbox\' checked=true onchange=\'toggleVisibility(NPMap.config.baseLayers);\' /> ' + 'Base Layer' + '<br>';

	var overlays = NPMap.config.overlays;
	for (var i = 0; i < overlays.length; i++) {
		html += '<input type=\'checkbox\' checked=true onchange=\'toggleVisibility("overlay-' + i + '");\' /> ' + overlays[i].name + '<br>';
	}
	return html;
}

var baseVisible = true,
	overlayVisible = [];
function toggleVisibility(layer) {
	if(layer === NPMap.config.baseLayers) {
		if(baseVisible) {
			baseVisible = false;
			for(var i = 0; i < layer.length; i++) {
				if(layer[i].L) NPMap.config.L.removeLayer(layer[i].L);
			}
		} else {
			baseVisible = true;
			for(var i = 0; i < layer.length; i++) {
				if(layer[i].L) NPMap.config.L.addLayer(layer[i].L);
			}
		}
	} else {
		var i = parseInt(layer.split('-')[1]);
		var _layer = NPMap.config.overlays[i];

		if(overlayVisible[i] || overlayVisible[i] === undefined) {
			overlayVisible[i] = false;
			NPMap.config.L.removeLayer(_layer.L);
		} else {
			overlayVisible[i] = true;
			NPMap.config.L.addLayer(_layer.L);
		}
	}
}
