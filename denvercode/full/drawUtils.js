var savedLayers = [];

var layersVisible = true;
function toggleLayerVisibility() {
  layersVisible = !layersVisible;

  if(layersVisible) {
    for(var i = 0; i < savedLayers.length; i++) {
      NPMap.config.L.editControl._featureGroup.addLayer(savedLayers[i]);
    }
    savedLayers = [];
  } else {
    for(var key in NPMap.config.L.editControl._featureGroup._layers) {
      var l = NPMap.config.L.editControl._featureGroup._layers[key];
      savedLayers.push(l);
      NPMap.config.L.editControl._featureGroup.removeLayer(l);
    }
  }
}

function clearLayers() {
  NPMap.config.L.editControl._featureGroup.clearLayers();
  savedLayers = [];
}
