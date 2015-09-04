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
}
