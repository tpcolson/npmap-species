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
	leafletImage(NPMap.config.L, function(err, canvas) {
		var imgData = canvas.toDataURL('image/png');
		var doc = new jsPDF('landscape');
		doc.addImage(imgData, 'PNG', 10, 10);
		doc.save('printed_map.pdf');
	});
}
