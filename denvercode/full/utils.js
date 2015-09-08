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
}
