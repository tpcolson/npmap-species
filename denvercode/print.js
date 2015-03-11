function print_map() {
	leafletImage(NPMap.config.L, function(err, canvas) {
		var imgData = canvas.toDataURL('image/png');
		var doc = new jsPDF('landscape');
		doc.addImage(imgData, 'PNG', 10, 10);
		doc.save('printed_map.pdf');
	});
}
