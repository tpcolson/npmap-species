function preparePrintControl() {
  /* modified from NPMap.js */
  var printContainer = L.DomUtil.create('div', 'leaflet-bar leaflet-control npmap-control-print'),
    bg = $('.npmap-toolbar .right li button').css('background-image');

  $('.leaflet-top.leaflet-left').append($(printContainer));
  $(printContainer).append($('.npmap-toolbar .right li button'));
  $('.npmap-map-wrapper').css({'top': '0px'});
  $('.npmap-control-print button').css({
    'background-image': bg,
    'background-repeat': 'no-repeat',
    'background-position': 'center',
    'border-top': '1px solid #1a2423',
    'height': '26px'
  });
  L.DomEvent.removeListener($('.npmap-control-print button').get(0), 'click', NPMap.config.L.printControl.print);
  $('.npmap-control-print button').click(function() {
    printMap();
  });
}

function printMap() {
  var attrEl = document.getElementsByClassName('leaflet-control-attribution')[0];

	leafletImage(NPMap.config.L, function(err, canvas) {
    html2canvas(attrEl, {
      onrendered: function(attrCanvas) {
    		var mapData = canvas.toDataURL('image/png'),
      		attrData = attrCanvas.toDataURL('image/png'),
          doc = new jsPDF('landscape', 'px', [$('#map').height(), $('#map').width()]);

    		doc.addImage(mapData, 'PNG', 0, 0, $('#map').width(), $('#map').height());
        doc.addImage(attrData, 'PNG', $('#map').height() - $(attrEl).height(),
          $('#map').width() - $(attrEl).width(), $(attrEl).width(), $(attrEl).height());
    		doc.save('species_mapper_snapshot.pdf');
      }
    });
	});
}
