window.onload = function() {
	/* Move zoom and measure controls directly below search tool */
	var el = document.getElementsByClassName('leaflet-top leaflet-left')[0];
	var searchBar = document.getElementById('search-tool');
	el.style.top = window.getComputedStyle(searchBar).getPropertyValue('height');

	/* Remove default base layer switcher */
	document.getElementsByClassName('npmap-control-switcher')[0].remove();

	/* turn off overlays by default */
	for(var i = 0; i < NPMap.config.overlays.length; i++) {
		var overlay = NPMap.config.overlays[i];

		if(overlay.name === 'Trails' || overlay.name === 'Visitor Centers' || overlay.name === 'Roads' || overlay.name === 'Shelters' || overlay.name === 'Campsites') {
			overlay.visible = false;
			NPMap.config.L.removeLayer(overlay.L);
		}
	}

	/* move annotation tools to tophat */
	var editControls = document.getElementsByClassName('leaflet-control-edit')[0];
	editControls.style.boxShadow = '0px';
	editControls.style.width = '84px';
	editControls.style.height = '26px';
  editControls.style.webkitBoxShadow = 'none';
  editControls.style.mozBoxShadow = 'none';
  editControls.style.msBoxShadow = 'none';
  editControls.style.oBoxShadow = 'none';
  editControls.style.boxShadow = 'none';
	editControls.children[2].remove();
	editControls.children[2].remove();
	editControls.children[0].style.borderTop = '0px';
	editControls.children[0].style.borderRadius = '4px 0px 0px 4px';
	editControls.children[2].style.borderRadius = '0px 4px 4px 0px';
	for(var i = 0; i < editControls.children.length; i++) {
		editControls.children[i].style.height = '26px';
		editControls.children[i].style.width = '26px';
		editControls.children[i].style.float = 'left';
	}
	document.getElementById('options-annotations-buttons').appendChild(editControls);

	/* prepare search tool */
	prepareSearchTool();
}

var tooltipsEnabled = true;
function toggleTooltips() {
	var tooltipsButton = document.getElementById('search-banner-help-tooltips').children[0].children[0];
	if(tooltipsEnabled) {
		tooltipsButton.innerHTML = 'TOOLTIPS OFF'
		// disable all tooltips
	} else {
		tooltipsButton.innerHTML = 'TOOLTIPS ON'
		// enable all tooltips
	}

	tooltipsEnabled = !tooltipsEnabled;
}

var minimized = false,
	currentBaseLayer = undefined;
function toggleMinimized() {
	var minButton = document.getElementById('search-banner-help-minimizer').children[0].children[0];
	if(!minimized) {
		minButton.innerHTML = '+';
		$('#search-tool').css({overflow: 'hidden'});
		$('#search-tool').animate({height:'40px'});
		$('.leaflet-top.leaflet-left').animate({top: '40px'});
	} else {
		minButton.innerHTML = '\u2014';
		$('#search-tool').animate({height:'189px'}, function() {
			$('#search-tool').css({overflow: 'visible'});
		});
		$('.leaflet-top.leaflet-left').animate({top: '189px'});
	}

	minimized = !minimized;
}

var lastBaseIndex = 0;
function updateBaseLayer() {
	var selector = document.getElementById('options-background-dropdown');
	if(selector.selectedIndex > 0) {
		/* remove last layer (taken from NPMap.js switcher.js) */
		NPMap.config.baseLayers[lastBaseIndex].visible = false;
		NPMap.config.L.removeLayer(NPMap.config.baseLayers[lastBaseIndex].L);

		/* add new layer (taken from NPMap.js switcher.js) */
		var newLayer = NPMap.config.baseLayers[selector.selectedIndex-1];
		if (newLayer.type === 'arcgisserver') {
			newLayer.L = L.npmap.layer[newLayer.type][newLayer.tiled === true ? 'tiled' : 'dynamic'](newLayer);
		} else {
			newLayer.L = L.npmap.layer[newLayer.type](newLayer);
		}
		newLayer.visible = true;
		currentBaseLayer = newLayer.L;
		NPMap.config.L.addLayer(newLayer.L);

		lastBaseIndex = selector.selectedIndex-1;
	}
}

function prepareOverlay() {
	var selector = document.getElementById('options-overlays-dropdown');
	selector.selectedIndex = 0;
}

function toggleOverlay() {
	var selector = document.getElementById('options-overlays-dropdown'),
		idx = selector.selectedIndex - 1,
		text = selector.options[idx+1].text;
	if(idx >= 0) {
		var overlay = NPMap.config.overlays[idx];
		if(text.charAt(0) !== '\u2714') {
			selector.options[idx+1].text = '\u2714 ' + text;
			overlay.visible = true;
			NPMap.config.L.addLayer(overlay.L);
		} else {
			selector.options[idx+1].text = text.substring(2, text.length);
			overlay.visible = false;
			NPMap.config.L.removeLayer(overlay.L);
		}
	}
	selector.selectedIndex = 0;
}

var showPredicted = true;
function togglePredicted() {
	showPredicted = !showPredicted;

	for(var i = 0; i < control._selectedSpecies.length; i++) {
		if(showPredicted) {
			control._selectedSpecies[i].predicted.addTo(NPMap.config.L);
		} else {
			NPMap.config.L.removeLayer(control._selectedSpecies[i].predicted);
		}
	}
}

var showObserved = false;
function toggleObserved() {
	showObserved = !showObserved;

	for(var i = 0; i < control._selectedSpecies.length; i++) {
		if(showObserved) {
			control._selectedSpecies[i].observed.addTo(NPMap.config.L);
		} else {
			NPMap.config.L.removeLayer(control._selectedSpecies[i].observed);
		}
	}
}

var whichName = 'common';
function toggleName() {
	if(whichName === 'common') {
		$('#search-initial-switch-button').children().animate({left:'0px'});
		whichName = 'latin';
	} else {
		$('#search-initial-switch-button').children().animate({left:'50px'});
		whichName = 'common';
	}

	var swapNeeded = $('#search-initial-dropdown').css('backgroundColor') === 'rgb(64, 181, 198)';
	if(swapNeeded) {
		var el = $('#search-initial-dropdown').children()[0],
			tmp = el.innerHTML;

		el.innerHTML = el.title;
		el.title = tmp;
	}
}
