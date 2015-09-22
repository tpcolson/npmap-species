var blendingActive = true;
function toggleBlending() {
  blendingActive = !blendingActive;

  $('div', '#legend-blend-switch-button').stop();
  if(blendingActive) {
    $('div', '#legend-blend-switch-button').animate({left: '25px'});

    for(var i = 0; i < control._selectedSpecies.length; i++) {
      var color;
      switch(i) {
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

      if(control._selectedSpecies[i] !== undefined) {
        if(showPredicted) {
          NPMap.config.L.removeLayer(control._selectedSpecies[i].predicted);
        }

        control._selectedSpecies[i].predicted = L.npmap.layer.mapbox({
          name: control._selectedSpecies[i]._latin,
          opacity: .5,
          id: 'nps.GRSM_' + control._selectedSpecies[i]._id + color
        });

        if(showPredicted) {
          control._selectedSpecies[i].predicted.addTo(NPMap.config.L);
        }
      }
    }
  } else {
    $('div', '#legend-blend-switch-button').animate({left: '0px'});

    for(var i = 0; i < control._selectedSpecies.length; i++) {
      var color;
      switch(i) {
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

      if(control._selectedSpecies[i] !== undefined) {
        if(showPredicted) {
          NPMap.config.L.removeLayer(control._selectedSpecies[i].predicted);
        }

        control._selectedSpecies[i].predicted = L.npmap.layer.mapbox({
          name: control._selectedSpecies[i]._latin,
          opacity: 1,
          id: 'nps.GRSM_' + control._selectedSpecies[i]._id + color
        });

        if(showPredicted) {
          control._selectedSpecies[i].predicted.addTo(NPMap.config.L);
        }
      }
    }
  }
}
