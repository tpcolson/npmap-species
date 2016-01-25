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
        color = '_pink';
        break;
      case 1:
        color = '_orange';
        break;
      case 2:
        color = '_blue';
        break;
      default:
        return;
    }

    if(control._selectedSpecies[idx] !== undefined) {
      if(showPredicted && control._selectedSpecies[idx].visible) {
        try {
          NPMap.config.L.removeLayer(control._selectedSpecies[idx].predicted);
        } catch(e) {}
      }

      control._selectedSpecies[idx].predicted = L.npmap.layer.mapbox({
        name: control._selectedSpecies[idx]._latin,
        opacity: blendingActive ? .5 : 1,
        id: 'nps.GRSM_' + control._selectedSpecies[idx]._id + color
      });

      if(showPredicted && control._selectedSpecies[idx].visible) {
        control._selectedSpecies[idx].predicted.addTo(NPMap.config.L);
      }
    }
  }
}

function reorderLayers() {
  $('#legend-species').children().each(function(idx) {
    var value;

    switch(this.id) {
      case 'legend-species-pink':
        value = 0;
        break;
      case 'legend-species-orange':
        value = 1;
        break;
      case 'legend-species-blue':
        value = 2;
        break;
      default:
        return;
    }

    order[$('#legend-species').children().length - idx - 1] = value;
  });

  recordAction('reordered layers: ' + order[2] + ' ' + order[1] + ' ' + order[0]);
}

function prepareLegendDrag() {
  $('#legend-species').sortable({
    handle: 'div.drag-handle',
    onDrop: function($item, container, _super) {
      _super($item, container);
      $item.css('height', '49px');
      $item.css('marginBottom', '1px');

      reorderLayers();
      drawData();
    }
  });
}
