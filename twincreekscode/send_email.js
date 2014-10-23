function send_email() {
	var d = new Date();

	$.ajax({
	type: 'POST',
	url: 'https://mandrillapp.com/api/1.0/messages/send.json',
	data: {
		'key': 'TYcLaIJLlKZonZjglixMZg',
		'message': {
			'from_email': 'jduggan1@vols.utk.edu',
			'to': [
				{
					'email': 'lyu6@vols.utk.edu',
					'name': 'Lonnie Yu',
					'type': 'to'
				}
			],
			'autotext': 'true',
			'subject': 'Updated Maxent Config File',
			'html': 'Lonnie, the config file has been updated at ' + produce_date(d) + '. Please react accordingly. Yours truly, Twin Creeks'
		}
	}});
}

function produce_date(d) {
	return d.getHours() + ':' + d.getMinutes() + ':' + d.getSeconds() + ', ' + d.getDate() + '-' + (parseInt(d.getMonth())+1) + '-' + d.getFullYear();
}
