require.config({
	baseUrl: '/static/js',
	paths: {
		fuse: 'vendor/fuse/src/fuse',
		jquery: 'vendor/jquery/dist/jquery',
		leaflet: 'vendor/leaflet/dist/leaflet',
		control: 'control',
		utils: 'utils'
	},

	shim: {
		leaflet: {
			exports: 'L',
			init: function() {
				return this.L.noConflict();
			},
		},

		fuse: {
			exports: 'Fuse',
		},
	}
});

require(['jquery', 'utils', 'control', 'leaflet'],
function ($, Util, Control) {

$(document).ready(function() {

	var control = new Control();
	window.NPMap = {
		div: 'map',
		baseLayers: [
			'nps-parkTiles3',
		],
		overlays: [{
			name: 'Park Boundary',
			url: 'https://services1.arcgis.com/fBc8EJBxQRMcHlei/arcgis/rest/services/Great_Smoky_Mountains_National_Park_Boundary/FeatureServer/0/query?f=geojson&outSR=4326&where=OBJECTID%20IS%20NOT%20NULL&outFields=*',
			type: 'geojson',
			popup: {
				description: '<div style="text-align: center">Great Smoky Mountains National Park</div>'
			},
			styles: {
				line: {
					'stroke': '#ab6124',
					'stroke-opacity': 0.9,
					'stroke-width': '2px'
				}
			}
		}],
		zoom: 10,
		center: { lat: 35.6, lng: -83.52 },
		minZoom: 10,
		maxZoom: 16,
		maxBounds: [
			{ lat: 35, lng: -84.5 },
			{ lat: 36.25, lng: -82.5 }
		],
		homeControl: false,
		editControl: true,
		printControl: true,
		measureControl: true,
		scaleControl: { metric: true },
		events: [{
			fn: function(evt) {
				if(control.currentBaseLayer &&
					evt.layer._leaflet_id === currentBaseLayer._leaflet_id) {
					drawData();
				}
			},
			type: 'layeradd'
		}]
	};


	Util.establishEventListeners(control);
	Util.prepareSearchTool(control);

	/* One of the only ways this worked */
	var s = document.createElement('script');
	s.src = 'https://www.nps.gov/lib/npmap.js/3.0.18/npmap-bootstrap.js';
	document.body.appendChild(s);

});
});
