/***
 *	Author: John Duggan (jduggan1 on GitHub & BitBucket)
 *	Email: jduggan1@vols.utk.edu OR johnduggan12@gmail.com
 *	Filename: config_gen.js
 *	Description: This takes the form from the Twin Creeks
 *		site and transforms it into a config file which
 *		can be used to control the atbi workflow
***/

/***
 * generate_config grabs data from the twin creeks form and builds
 * a config file to control the atbi workflow
***/
function generate_config() {
	// filename for the configuration file
	var config_fname = 'config.txt'

	// object to contain the data grabbed from the form
	var form_data;

	// boolean, true if config file was successfully produced
	var success;

	// grab the form data
	form_data = grab_form_data();
	if(form_data == null) return true;

	// build the config file
	success = produce_config_file(config_fname, form_data);
	if(!success) return true;

	return false;
}

/***
 * retrieves the data from the submission form
***/
function grab_form_data() {
	// object to store the form data
	var data = {};

	// list of species
	var sp_list = [];

	// options div
	var options;

	// input options
	var inputs;

	// select options
	var selects;

	// build options list
	options = document.getElementById('options');
	if(options == null) {
		alert('Couldn\'t find any options');
		return null;
	}
	inputs = options.getElementsByTagName('input');
	for(var i = 0; i < inputs.length; i++) {
		if(inputs[i].type == 'checkbox') {
			data[inputs[i].name] = inputs[i].checked;
		} else {
			data[inputs[i].name] = inputs[i].value;
		}
	}
	selects = options.getElementsByTagName('select');
	for(var i = 0; i < selects.length; i++) {
		data[selects[i].name] = selects[i].options[selects[i].selectedIndex].value;
	}

	// build species list
	species = document.getElementById('species_list').getElementsByTagName('input');
	for(var i = 0; i < species.length; i++) {
		if(species[i].checked) {
			sp_list.push(species[i].name);
		}
	}
	data['species'] = sp_list;

	return data;
}

/***
 * build the config file and kick it to GitHub
***/
function produce_config_file(fname, data) {
	// string containing the contents of the configuration file
	var config_contents = '';

	// make sure the filename is valid
	if(fname == null || fname.length == 0) {
		alert('invalid configuration filename');
		return false;
	}
	
	// make sure the form data is valid
	if(data == null) {
		alert('missing or invalid data');
		return false;
	}
	
	// write the config file
	for (var key in data) {
		config_contents += '\'' + key + '\':\'' + data[key] + '\'';
	}

	// post to server for kicking to GitHub
	post_config(config_contents);

	return true;
}

/***
 * kick the config file to github
***/
function post_config(contents) {
	var socket = new WebSocket('ws://localhost:5678/websocket');

	setTimeout(function() {
		socket.send('push:' + contents);
	}, 10000);
}
