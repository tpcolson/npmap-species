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
      console.log('found in selection:', control._selectedSpecies[idx]);

      let geoJSON = undefined;
      let specid = control._selectedSpecies[idx]._id;
      console.log(specid);
      if(specid == 'grp') {
        let grp = control._selectedSpecies[idx]._latin;
        let sub = control._selectedSpecies[idx]._common;
        console.log('grp and subgrp: ', grp, sub);
        sub = sub.replace(' ', '-');
        $.ajax({
          //url : `http://a.tiles.mapbox.com/v4/nps.GRSM_${control._selectedSpecies[idx]._id + color}.json?access_token=pk.eyJ1IjoibnBzIiwiYSI6IkdfeS1OY1UifQ.K8Qn5ojTw4RV1GwBlsci-Q`,
          url: `https://atlas-stg.geoplatform.gov/v4/atlas-user.grp-${grp}-${sub}${color}.json?access_token=pk.eyJ1IjoiYXRsYXMtdXNlciIsImEiOiJjazFmdGx2bjQwMDAwMG5wZmYwbmJwbmE2In0.lWXK2UexpXuyVitesLdwUg`,
          type : "get",
          async: false,
          success : function(response) {
            geoJSON = response;
          },
          error: function() {
            console.log(`Could not find group tiles for grp-${grp}-${sub}${color}`);
          }
        });
      } else {
        console.log('Attempting to fetch species mbtiles... id is:', specid);
        $.ajax({
          //url : `http://a.tiles.mapbox.com/v4/nps.GRSM_${control._selectedSpecies[idx]._id + color}.json?access_token=pk.eyJ1IjoibnBzIiwiYSI6IkdfeS1OY1UifQ.K8Qn5ojTw4RV1GwBlsci-Q`,
          url: `https://atlas-stg.geoplatform.gov/v4/atlas-user.${specid}${color}.json?access_token=pk.eyJ1IjoiYXRsYXMtdXNlciIsImEiOiJjazFmdGx2bjQwMDAwMG5wZmYwbmJwbmE2In0.lWXK2UexpXuyVitesLdwUg`,
          type : "get",
          async: false,
          success : function(response) {
            geoJSON = response;
          },
          error: function() {
            console.log(`Could not find group tiles for ${specid}${color}`);
          }
        });
      }

      console.log(control._selectedSpecies[idx]);

      if (geoJSON) {
        control._selectedSpecies[idx].predicted = L.npmap.layer.mapbox({
          name: control._selectedSpecies[idx]._latin,
          opacity: blendingActive ? .5 : 1,
          tileJson: geoJSON
        });
      } else {
        control._selectedSpecies[idx].predicted = L.npmap.layer.mapbox({
          name: control._selectedSpecies[idx]._latin,
          opacity: blendingActive ? .5 : 1,
          id: 'nps.GRSM_' + control._selectedSpecies[idx]._id + color
        });
      }

      if(showPredicted && control._selectedSpecies[idx].visible) {
        control._selectedSpecies[idx].predicted.addTo(NPMap.config.L);
      }
    }
  }
}

function reorderLayers() {
  // $('#legend-species').children().each(function(idx) {
  //   var value;

  //   switch(this.id) {
  //     case 'legend-species-pink':
  //       value = 0;
  //       break;
  //     case 'legend-species-orange':
  //       value = 1;
  //       break;
  //     case 'legend-species-blue':
  //       value = 2;
  //       break;
  //     default:
  //       return;
  //   }

  //   order[$('#legend-species').children().length - idx - 1] = value;
  // });

  // recordAction('reordered layers', order[2] + ' ' + order[1] + ' ' + order[0]);
}

function prepareLegendDrag() {
  // $('#legend-species').sortable({
  //   handle: 'div.drag-handle',
  //   onDrop: function($item, container, _super) {
  //     _super($item, container);
  //     $item.css('height', '49px');
  //     $item.css('marginBottom', '1px');

  //     reorderLayers();
  //     drawData();
  //   }
  // });
}
