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

	// form object
	var form;

	// array of input elements from the form
	var inputs;

	// build form object
	form = document.forms['submission_form'];
	if(form == null) {
		alert('Couldn\'t grab the form document');
		return null;
	}

	// build array of the input elements
	inputs = form.getElementsByTagName('input');
	if(inputs == null) {
		alert('Couldn\'t find any form fields');
		return null;
	}

	// build up data array
	for(var i = 0; i < inputs.length; i++) {
		if(inputs[i].type == 'text') data[inputs[i].name] = inputs[i].value;
		else if(inputs[i].type == 'checkbox') {
			//make sure array is initialized
			if(!('species' in data)) data['species'] = [];

			//if checked, add species to the config file
			if(inputs[i].checked == true) {
				data['species'].push(inputs[i].name);
			}
		}
		else {
			alert('Invalid input element with name ' + inputs[i].name + ' of type ' + inputs[i].type);
			return null;
		}
	}

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
	config_contents += data['replicates'] + '\n';
	for(var sp in data['species']) {
		config_contents += data['species'][sp] + '\n';
	}

	// kick to GitHub
	post_config(config_contents);

	return true;
}

/***
 * kick the config file to github
***/
function post_config(contents) {
	var socket = new WebSocket('ws://localhost:5678/websocket');

	setTimeout(function() {
		socket.send(contents);
	}, 10000);
}
