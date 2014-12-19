var NPMap = {
	div: 'main-map',
	baseLayers: [
		'nps-parkTilesImagery', /* first item is the default baseLayer */
		'nps-lightStreets',
		'nps-neutralTerrain',
		'nps-parkTiles',
		'nps-satelliteNight',
		'bing-aerial',
		'bing-aerialLabels',
		'bing-roads',
		'esri-gray',
		'esri-imagery',
		'esri-nationalGeographic',
		'esri-oceans',
		'esri-streets',
		'esri-topographic',
		'mapbox-light',
		'mapbox-outdoors',
		'mapbox-satellite',
		'mapbox-satelliteLabels',
		'mapbox-streets',
		'mapbox-terrain',
		'openstreetmap',
		'stamen-toner',
		'stamen-watercolor'
	],
	//TODO: overlays need to be able to be toggled on and off (nothing too scary)
	overlays: [{
		name: 'Habitat',
		id: 'lonnieljyu.test',
		type: 'mapbox'
	}, {
		name: 'Observations',
		url: 'Abies_fraseri.geojson',
		type: 'geojson',
		popup: {
			title: 'Observation',
			description: 'Coordinates: {{coordinates}}'
		},
		styles: {
			point: {
				'marker-color': '#7a904f',
				'marker-size': 'small'
			}
		},
		cluster: {
			clusterIcon: '#7a904f'
		},
		showCoverageOnHover: true,
		disableClusteringAtZoom: 15,
		polygonOptions: {
			color: '#7a904f',
			fillColor: '#7a904f'
		}
	}],
	zoom: 10,
	center: { lat: 35.6, lng: -83.52 },
	minZoom: 10,
	maxZoom: 16,
	maxBounds: [
		{ lat: 35.25, lng: -84.25 },
		{ lat: 35.9, lng: -82.75 }
	],
	fullscreenControl: true,
	shareControl: true,
	printControl: true,
	legendControl: {
		html: setLegend
	},
	locateControl: true, //TODO: Check if Tom wants this
	measureControl: true,
	editControl: true,
	scaleControl: true
};
