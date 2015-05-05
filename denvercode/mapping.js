var subNavZ, headerZ, divHeader, divSubNav,
	NPMap = {
		div: 'main-map',
		baseLayers: [
			'mapbox-terrain',
			'nps-parkTiles',
			'esri-topographic',
			'esri-imagery'
		],
		//TODO: overlays need to be able to be toggled on and off (nothing too scary)
		overlays: [{
			name: 'Orange',
			id: 'jduggan1.Acer_pensylvanicum_orange',
			type: 'mapbox',
			opacity: 0.5
		}, {
			name: 'Pink',
			id: 'jduggan1.Acer_rubrum_v_rubrum_pink',
			type: 'mapbox',
			opacity: 0.5
		}, {
			name: 'Blue',
			id: 'jduggan1.Acer_saccharum_blue',
			type: 'mapbox',
			opacity: 0.5
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
		}, {
			name: 'Trails',
			url: 'http://services1.arcgis.com/fBc8EJBxQRMcHlei/arcgis/rest/services/GRSM_TRAILS/FeatureServer/0/query?f=geojson&outSR=4326&where=OBJECTID%20IS%20NOT%20NULL&outFields=NAME',
			type: 'geojson',
			styles: {
				line: {
					'stroke': '#cb9733',
					'stroke-opacity': 0.75
				}
			}
		}, {
			name: 'Shelters',
			url: 'http://services1.arcgis.com/fBc8EJBxQRMcHlei/arcgis/rest/services/GRSM_BACK_COUNTY_SHELTERS/FeatureServer/0/query?f=geojson&outSR=4326&where=OBJECTID%20IS%20NOT%20NULL&outFields=NAME',
			type: 'geojson',
			styles: {
				point: {
					'marker-color': '#cb9733',
					'marker-size': 'small',
					'marker-symbol': 'building'
				}
			}
		}, {
			name: 'Roads',
			url: 'http://services1.arcgis.com/fBc8EJBxQRMcHlei/arcgis/rest/services/GRSM_Road_Centerline/FeatureServer/0/query?f=geojson&outSR=4326&where=OBJECTID%20IS%20NOT%20NULL&outFields=NAME',
			type: 'geojson',
			styles: {
				line: {
					'stroke': '#222222',
					'stroke-opacity': 0.75
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
		//downloadControl: true, //TODO: this would be useful (once implemented, we could link to the relevant data store page)
		fullscreenControl: true,
		//zoomdisplayControl: true,
		//shareControl: true, //TODO: this would be useful once implemented
		//legendControl: {
		//	html: setLegend
		//},
		//locateControl: true, //TODO: Check if Tom wants this
		measureControl: true,
		//editControl: true,
		//scaleControl: true,
		events: [{
			fn: function() {
				setDivs();
				control._container.style.width = window.getComputedStyle(document.getElementsByClassName('npmap-map-wrapper')[0]).getPropertyValue('width');
				control._optionsDiv.style.left = parseInt((parseInt(window.getComputedStyle(document.getElementsByClassName('npmap-map-wrapper')[0]).getPropertyValue('width')) - 684 + 40) / 2) + 'px';
				control._fullscreen = true;
				document.getElementById('home').style.top = '400px';
				document.getElementById('zoom').style.top = '400px';
				document.getElementById('measure').style.top = '400px';
				enterfullscreen();
			},
			type: 'enterfullscreen'
		}, {
			fn: function() {
				setDivs();
				control._container.style.width = window.getComputedStyle(document.getElementsByClassName('npmap-map-wrapper')[0]).getPropertyValue('width');
				control._optionsDiv.style.left = parseInt((parseInt(window.getComputedStyle(document.getElementsByClassName('npmap-map-wrapper')[0]).getPropertyValue('width')) - 684 + 40) / 2) + 'px';
				control._fullscreen = false;
				document.getElementById('home').style.top = '225px';
				document.getElementById('zoom').style.top = '225px';
				document.getElementById('measure').style.top = '225px';
				exitfullscreen();
			},
			type: 'exitfullscreen'
		}]
	};
