var NPMap = {
  div: 'spmap',
  baseLayers: [
    'nps-parkTiles',
  ],
  overlays: [{
    name: 'Park Boundary',
    url: 'http://services1.arcgis.com/fBc8EJBxQRMcHlei/arcgis/rest/services/Great_Smoky_Mountains_National_Park_Boundary/FeatureServer/0/query?f=geojson&outSR=4326&where=OBJECTID%20IS%20NOT%20NULL&outFields=*',
    type: 'geojson',
    popup: {
      description: '<center>Great Smoky Mountains National Park</center>'
    },
    styles: {
      line: {
        'stroke': '#ab6124',
        'stroke-opacity': 0.9,
        'stroke-width': '2px'
      }
    }
  }],
  zoom: 9,
  center: { lat: 35.6, lng: -83.52 },
  minZoom: 9,
  maxZoom: 16,
  maxBounds: [
      { lat: 35, lng: -84.5 },
      { lat: 36.25, lng: -82.5 }
  ],
  homeControl: false,
  measureControl: true,
  scaleControl: { metric: true },
}
