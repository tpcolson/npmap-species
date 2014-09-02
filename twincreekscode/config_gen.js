/***
 *	Author: John Duggan (jduggan1 on GitHub & BitBucket)
 *	Email: jduggan1@vols.utk.edu OR johnduggan12@gmail.com
 *	Last update: September 1, 2014
 *	Version: 0.0.0
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
	var config_fname = 'config.cfg'

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
		data[inputs[i].name] = inputs[i].value;
	}

	return data;
}

function produce_config_file(fname, data) {
	// string containing the contents of the configuration file
	var config_contents = '';

	// blob object for presenting the resulting config file for download
	var file;

	// make sure the filename is valid (we guarantee that the data is valid)
	if(fname == null || fname.length == 0) {
		alert('invalid configuration filename');
		return false;
	}

	for(var key in data) {
		config_contents = config_contents.concat(key + ': ' + data[key] + '\n'); 
		alert(config_contents);
	}

	/*** QUESTIONABLE CODE BELOW!!! ***/
	// create the file
	file = new Blob([config_contents], { type : fname+'/plain' });

	// present the file to the user for download
	window.open(window.URL.createObjectURL(file));
	/*** QUESTIONABLE CODE OVER!!! ***/

	return true;
}
