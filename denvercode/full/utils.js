window.onload = function() {
	/* Move zoom and measure controls directly below search tool */
	var el = document.getElementsByClassName('leaflet-top leaflet-left')[0];
	var searchBar = document.getElementById('search-tool');
	el.style.top = window.getComputedStyle(searchBar).getPropertyValue('height');

	/* Remove default base layer switcher */
	document.getElementsByClassName('npmap-control-switcher')[0].remove();
}
