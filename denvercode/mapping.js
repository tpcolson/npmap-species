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
	'stamen-toner',
	'stamen-watercolor'
  ],
  //TODO: overlays need to be able to be toggled on and off (nothing too scary)
  overlays: [{
	name: 'habitat',
    id: 'lonnieljyu.test',
    type: 'mapbox'
  }, {
	name: 'observations',
	url: 'Abies_fraseri.geojson',
	type: 'geojson',
	clickable: false,
	styles: {
	  point: {
		'marker-color': '#896c9c',
		'marker-size': 'small' /* TODO: perhaps could ask Nate to be able to provide own object for this instead of the three presets */
	  }
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
  scaleControl: true,
  printControl: true,
  locateControl: true, //TODO: Check if Tom wants this
  measureControl: true,
  shareControl: true,
  editControl: true
};

/* TODO: fix this, the functions are not called */
var NPMapUtils = {
  fullscreenControl: {
	listeners: {
	  enterfullscreen: function() {
		alert('hello');
		//divHeader.style.zIndex = -1;
		//divSubNav.style.zIndex = -1;
	  },
	  exitfullscreen: function() {
		alert('world');
		//divHeader.style.zIndex = 100;
		//divSubNav.style.zIndex = 100;
	  }
	}
  }
};
