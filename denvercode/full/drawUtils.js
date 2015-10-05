var savedLayers = [];

var layersVisible = true;
function toggleLayerVisibility() {
  layersVisible = !layersVisible;

  if(layersVisible) {
    recordAction('show drawn objects');
    $($('#options-annotations').children()[2]).children().html('Hide Layers');
    $('.leaflet-control-edit').children().prop('disabled', false);
    for(var i = 0; i < savedLayers.length; i++) {
      NPMap.config.L.editControl._featureGroup.addLayer(savedLayers[i]);
    }
    savedLayers = [];
  } else {
    recordAction('hide drawn objects');
    $($('#options-annotations').children()[2]).children().html('Show Layers');
    $('.leaflet-control-edit').children().prop('disabled', true);
    for(var key in NPMap.config.L.editControl._featureGroup._layers) {
      var l = NPMap.config.L.editControl._featureGroup._layers[key];
      savedLayers.push(l);
      NPMap.config.L.editControl._featureGroup.removeLayer(l);
    }
  }
}

function clearLayers() {
  recordAction('removed all drawn objects');
  NPMap.config.L.editControl._featureGroup.clearLayers();
  savedLayers = [];
  if(!layersVisible) {
    toggleLayerVisibility();
  }
}
