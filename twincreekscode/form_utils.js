function select_all() {
	update_checkboxes('select');
}

function clear_all() {
	update_checkboxes('clear');
}

/* modify all species and groups checkboxes based on the option */
function update_checkboxes(option) {
	var	species,
		groups,
		inputs;

	species = document.getElementById('species_list').getElementsByTagName('input');
	if(species == null) {
		alert('Couldn\'t find any species');
		return;
	}

	groups = document.getElementById('groups').getElementsByTagName('input');
	if(groups == null) {
		alert('Couldn\'t find any groups');
		return;
	}

	for(var i = 0; i < species.length; i++) {
		switch(option) {
			case 'select':
				species[i].checked = true;
				break;
			case 'clear':
				species[i].checked = false;
				break;
			default:
				break;
		}
	}

	for(var i = 0; i < groups.length; i++) {
		switch(option) {
			case 'select':
				groups[i].checked = true;
				break;
			case 'clear':
				groups[i].checked = false;
				break;
			default:
				break;
		}
	}
}

/* 
 * grab the updated species list from GitHub, update the species and groups lists, and post
 * the data to the server to store the new list in twincreeks.html
 */
function update_species() {
	/* list of species already found when parsing the csv */
	var encountered_species = [];

	/* list of groups already found when parsing the csv */
	var encountered_groups = [];

	/* sha for the ATBI_records.csv file on GitHub */
	var target_sha;

	/* iterator for GitHub tree collection (which contains the sha of our desired file) */
	var iterator;

	/* string containing the csv file */
	var contents;

	/* list containing the lines of the csv */
	var lines;

	/* temp list for storing a split line */
	var tokens;

	/* string containing new innerHTML for species div */
	var new_species = '';

	/* string containing new innerHTML for groups div */
	var new_groups = '';

	/* object for disabling the page */
	var blackout = document.getElementById('blackout');

	/* since this will take a while, make sure they are committed to this */
	if(!confirm('Are you sure? This may take some time (the page will be unusable during this time).')) {
		return;
	}

	/* disable the full page during this time */
	blackout.style.display = 'block';

	/* first, search for the correct sha for the ATBI_records.csv file (the file is over 1 MB, so we must use the GitHub blob api */
	$.ajax({
		type: 'GET',
		url: 'https://api.github.com/repos/nationalparkservice/npmap-species/git/trees/master:atbirecords',
		dataType: 'jsonp',
		success: function(data) {
			iterator = data['data']['tree'];
			for(var i = 0; i < iterator.length; i++) {
				if(iterator[i]['path'] == 'ATBI_records.csv') {
					target_sha = iterator[i]['sha'];
				}
			}

			/* once we have the sha, grab the file */
			$.ajax({
				type: 'GET',
				url: 'https://api.github.com/repos/nationalparkservice/npmap-species/git/blobs/' + target_sha,
				dataType: 'jsonp',
				success: function(data) {
					/* if everything went well, let's parse this thing, update the page, and send it to update the html */
					contents = window.atob(data['data']['content'].replace(/\s/g, ''));
					lines = contents.split('\n');

					/* read each line, start at 1 to skip header line */
					for(var i = 1; i < lines.length; i++) {
						token = lines[i].split(',');
						if(token[0] != '') { token[0] = token[0][0].toUpperCase() + token[0].slice(1); }
						if(token[3] != '' && token[3] != undefined) { token[3] = token[3][0].toUpperCase() + token[3].slice(1); }

						if(token[3] != '' && token[3] != undefined) {
							if(encountered_species.indexOf(token[0] + ':' + token[3]) == -1 && token[0] != '') {
								encountered_species.push(token[0] + ':' + token[3]);
							}
						} else {
							if(encountered_species.indexOf(token[0]) == -1 && token[0] != '') {
								encountered_species.push(token[0]);
							}
						}

						if(encountered_groups.indexOf(token[3]) == -1 && token[3] != '' && token[3] != undefined) {
							encountered_groups.push(token[3]);
						}
					}

					/* sort the two lists so that species and groups are in alphabetical order */
					encountered_species.sort();
					encountered_groups.sort();

					/* create the new innerHTML for species and groups divs */
					for(var i = 0; i < encountered_species.length; i++) {
						var sp = encountered_species[i].split(':');
						if(sp[1] == undefined || sp[1] == '') {
							new_species = new_species + '<input type=\'checkbox\' name=\'' + sp[0] + '\' value=\'\'></input>' + sp[0] + '<br>';
						} else {
							new_species = new_species + '<input type=\'checkbox\' name=\'' + sp[0] + '\' value=\'' + sp[1] + '\'></input>' + sp[0] + '<br>';
						}
					}
					for(var i = 0; i < encountered_groups.length; i++) {
						new_groups = new_groups + '<input type=\'checkbox\' name=\'' + encountered_groups[i] + '\' onclick=\'changeGroup(this)\'></input>' + encountered_groups[i] + '<br>';
					}

					/* update the page */
					document.getElementById('species_list').innerHTML = new_species;
					document.getElementById('groups').innerHTML = new_groups;

					/* reenable the page */
					blackout.style.display = 'none';
				}
			});
		}
	});
}

function changeGroup(checkbox) {
	var species = document.getElementById('species_list').getElementsByTagName('input');

	if(checkbox.checked) {
		for(var i = 0; i < species.length; i++) {
			if(checkbox.name == species[i].value) {
				species[i].checked = true;
			}
		}
	} else {
		for(var i = 0; i < species.length; i++) {
			if(checkbox.name == species[i].value) {
				species[i].checked = false;
			}
		}
	}
}
