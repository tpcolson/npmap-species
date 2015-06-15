function enterfullscreen() {
	document.getElementsByClassName('fullscreen')[0].title = 'Exit fullscreen';
	headerZ = divHeader.style.zIndex;
	subNavZ = divSubNav.style.zIndex;
	divHeader.style.zIndex = 0;
	divSubNav.style.zIndex = 0;
}

function exitfullscreen() {
	document.getElementsByClassName('fullscreen')[0].title = 'Enter fullscreen';
	if(headerZ !== undefined && subNavZ !== undefined) {
		divHeader.style.zIndex = headerZ;
		divSubNav.style.zIndex = subNavZ;
	}
}

function setDivs() {
	if(divHeader === undefined) {
		divHeader = document.getElementById('header');
	}

	if(divSubNav === undefined) {
		divSubNav = document.getElementById('sub-nav');
	}
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

var switcher, selected;
window.onload = function() {
	/* remove default switcher */
	var sw = document.getElementsByClassName('npmap-control-switcher')[0];
	sw.remove();

	/* turn off overlays by default */
	for(var i = 0; i < NPMap.config.overlays.length; i++) {
		var overlay = NPMap.config.overlays[i];

		/* todo: remove this if statement once everything else is done */
		if(overlay.name === 'Trails' || overlay.name === 'Roads' || overlay.name === 'Shelters') {
			overlay.visible = false;
			NPMap.config.L.removeLayer(overlay.L);
		}
	}

	/* add in search tool */
	var st = new SearchTool();
	NPMap.config.L.addControl(st);

	/* add in floating div */
	addColorLegend();

	/* add tooltip to fullscreen button */
	document.getElementsByClassName('fullscreen')[0].title = 'Enter fullscreen';
}
