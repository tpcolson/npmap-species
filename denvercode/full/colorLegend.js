var blendingActive = true;
function toggleBlending() {
  blendingActive = !blendingActive;

  $('div', '#legend-blend-switch-button').stop();
  if(blendingActive) {
    $('div', '#legend-blend-switch-button').animate({left: '25px'});
  } else {
    $('div', '#legend-blend-switch-button').animate({left: '0px'});
  }

  drawData();
}

var order = [
  2,
  1,
  0
];
function drawData() {
  for(var i = 0; i < order.length; i++) {
    var idx = order[i],
      color;
    switch(idx) {
      case 0:
        color = '_blue';
        break;
      case 1:
        color = '_pink';
        break;
      case 2:
        color = '_orange';
        break;
      default:
        return;
    }

    if(control._selectedSpecies[idx] !== undefined) {
      if(showPredicted) {
        try {
          NPMap.config.L.removeLayer(control._selectedSpecies[idx].predicted);
        } catch(e) {}
      }

      control._selectedSpecies[idx].predicted = L.npmap.layer.mapbox({
        name: control._selectedSpecies[idx]._latin,
        opacity: blendingActive ? .5 : 1,
        id: 'nps.GRSM_' + control._selectedSpecies[idx]._id + color
      });

      if(showPredicted) {
        control._selectedSpecies[idx].predicted.addTo(NPMap.config.L);
      }
    }
  }
}
