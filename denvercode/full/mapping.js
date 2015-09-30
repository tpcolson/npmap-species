var subNavZ, headerZ, divHeader, divSubNav,
	NPMap = {
		div: 'map',
		baseLayers: [
			'nps-parkTiles',
			'mapbox-terrain',
			'esri-topographic',
			'esri-imagery'
		],
		overlays: [{
			name: 'Trails',
			url: 'http://services1.arcgis.com/fBc8EJBxQRMcHlei/arcgis/rest/services/GRSM_TRAILS/FeatureServer/0/query?f=geojson&outSR=4326&where=OBJECTID%20IS%20NOT%20NULL&outFields=NAME',
			type: 'geojson',
			popup: {
				title: '<center>{{TRAILNAME}}</center>'
			},
			styles: {
				line: {
					'stroke': '#cb9733',
					'stroke-opacity': 0.75
				}
			}
		}, {
			name: 'Visitor Centers',
			url: 'http://services1.arcgis.com/fBc8EJBxQRMcHlei/ArcGIS/rest/services/GRSM_VISITOR_CENTERS/FeatureServer/0/query?f=geojson&outSR=4326&where=OBJECTID%20IS%20NOT%20NULL&outFields=*',
			type: 'geojson',
			popup: {
				title: '<center>{{LOC_NAME}}</center>'
			},
			styles: {
				point: {
					'marker-color': '#663300',
					'marker-size': 'small',
					'marker-symbol': 'building'
				}
			}
		}, {
			name: 'Shelters',
			url: 'http://services1.arcgis.com/fBc8EJBxQRMcHlei/ArcGIS/rest/services/GRSM_BACKCOUNTRY_SHELTERS/FeatureServer/0/query?f=geojson&outSR=4326&where=OBJECTID%20IS%20NOT%20NULL&outFields=*',
			type: 'geojson',
			popup: {
				title: '<center>{{TEXT_NAME}}</center>'
			},
			styles: {
				point: {
					'marker-color': '#cb9733',
					'marker-size': 'small',
					'marker-symbol': 'building'
				}
			}
		}, {
			name: 'Roads',
			url: 'http://services1.arcgis.com/fBc8EJBxQRMcHlei/arcgis/rest/services/GRSM_ROAD_CENTERLINES/FeatureServer/0/query?f=geojson&outSR=4326&where=OBJECTID%20IS%20NOT%20NULL&outFields=*',
			type: 'geojson',
			popup: {
				title: '<center>{{FULLNAME}}</center>'
			},
			styles: {
				line: {
					'stroke': '#222222',
					'stroke-opacity': 0.75
				}
			}
		}, {
			name: 'Campsites',
			url: 'http://services1.arcgis.com/fBc8EJBxQRMcHlei/ArcGIS/rest/services/GRSM_BACKCOUNTRY_CAMPSITES/FeatureServer/0/query?f=geojson&outSR=4326&where=OBJECTID%20IS%20NOT%20NULL&outFields=*',
			type: 'geojson',
			popup: {
				title: '<center>{{LABEL}}</center>'
			},
			styles: {
				point: {
					'marker-color': '#cb9733',
					'marker-size': 'small',
					'marker-symbol': 'campsite'
				}
			}
		}, {
			name: 'Park Boundary',
			url: 'http://services1.arcgis.com/fBc8EJBxQRMcHlei/arcgis/rest/services/Great_Smoky_Mountains_National_Park_Boundary/FeatureServer/0/query?f=geojson&outSR=4326&where=OBJECTID%20IS%20NOT%20NULL&outFields=*',
			type: 'geojson',
			popup: {
				title: '<center>Great Smoky Mountains National Park</center>'
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
		measureControl: true,
		scaleControl: { metric: true },
		events: [{
			fn: function(evt) {
				if(currentBaseLayer && evt.layer._leaflet_id === currentBaseLayer._leaflet_id) {
					drawData();
				}
			},
			type: 'layeradd'
		}]
	};
