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

	/* lists of groups already found when parsing the csv */
	var encountered_taxa = [];
	var encountered_sbj = [];
	var encountered_category = [];

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

	/* lists of species groups */
	var taxa;
	var sbj;
	var category;

	/* subjects from atbi_records.csv */
	var subjects;
	var subject;

	/* string containing new html for species div */
	var new_species = '';

	/* strings containing new html for groups div */
	var new_taxa = '<center><u>Taxa</u></center><br>';
	var new_sbj = '<center><u>Subjects</u></center><br>';
	var new_category = '<center><u>Categories</u></center><br>';

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
						if(token.length != 9) {
							continue;
						}

						/* get name */
						if(token[0] != '') {
							token[0] = token[0].replace(/_/g, ' ');
							token[0] = token[0][0].toUpperCase() + token[0].slice(1).toLowerCase();
							token[0] = '<i>' + token[0] + '</i>';

							if(token[3] != '' && token[3] != 'Unspecified') {
								token[0] += ' (' + token[3] + ')';
							} else {
								token[0] += ' (Common name unknown)';
							}
						}

						/* get groups */
						taxa = undefined;
						if(token[4] != 'Unspecified') {
							taxa = token[4].replace(/\s+/g, '_');
						}

						sbj = [];
						subjects = token[5].split('|');
						for(var key in subjects) {
							if(subjects[key] != '' && subjects[key] != undefined) {
								subject = subjects[key].trim();
								if(subject != undefined && subject != '') {
									sbj.push(subject.replace(/\s+/g, '_'));
								}
							}
						}

						category = undefined;
						if(token[6] != 'Unspecified') {
							category = token[6].replace(/\s+/g, '_');
						}

						for(var key in sbj) {
							if(encountered_sbj.indexOf(sbj[key]) == -1 && sbj[key] != '' && sbj[key] != undefined) {
								encountered_sbj.push(sbj[key]);
							}
						}
						if(encountered_taxa.indexOf(taxa) == -1 && taxa != '' && taxa != undefined) {
							encountered_taxa.push(taxa);
						}
						if(encountered_category.indexOf(category) == -1 && category != '' && category != undefined) {
							encountered_category.push(category);
						}

						if(taxa != undefined && taxa != '') {
							sbj.push(taxa);
						}
						if(category != undefined && category != '') {
							sbj.push(category);
						}
						if(encountered_species.indexOf(token[0] + ':' + sbj.join(' ')) == -1 && token[0] != '') {
							encountered_species.push(token[0] + ':' + sbj.join(' '));
						}
					}

					/* sort the two lists so that species and groups are in alphabetical order */
					encountered_species.sort();
					encountered_taxa.sort();
					encountered_sbj.sort();
					encountered_category.sort();

					/* create the new html for species and groups divs */
					for(var i = 0; i < encountered_species.length; i++) {
						var sp = encountered_species[i].split(':');
						sp[1] = sp.slice(1).join(':');

						if(sp[1] == undefined || sp[1] == '') {
							new_species = new_species + '<input type=\'checkbox\' name=\'' + sp[0] + '\' class=\'\'></input>' + sp[0] + '<br>';
						} else {
							new_species = new_species + '<input type=\'checkbox\' name=\'' + sp[0] + '\' class=\'' + sp[1] + '\'></input>' + sp[0] + '<br>';
						}
					}
					for(var i = 0; i < encountered_taxa.length; i++) {
						new_taxa = new_taxa + '<input type=\'checkbox\' name=\'' + encountered_taxa[i] + '\' onclick=\'changeGroup(this)\'></input>' + encountered_taxa[i].replace(/_/g, ' ') + '<br>';
					}
					for(var i = 0; i < encountered_sbj.length; i++) {
						new_sbj = new_sbj + '<input type=\'checkbox\' name=\'' + encountered_sbj[i] + '\' onclick=\'changeGroup(this)\'></input>' + encountered_sbj[i].replace(/_/g, ' ') + '<br>';
					}
					for(var i = 0; i < encountered_category.length; i++) {
						new_category = new_category + '<input type=\'checkbox\' name=\'' + encountered_category[i] + '\' onclick=\'changeGroup(this)\'></input>' + encountered_category[i].replace(/_/g, ' ') + '<br>';
					}

					/* update the page */
					document.getElementById('species_list').innerHTML = new_species;
					document.getElementById('groups_taxa').innerHTML = new_taxa;
					document.getElementById('groups_sbj').innerHTML = new_sbj;
					document.getElementById('groups_category').innerHTML = new_category;

					/* reenable the page */
					blackout.style.display = 'none';
				}
			});
		}
	});
}

function changeGroup(checkbox) {
	var name = checkbox.name;
	var species = document.getElementById('species_list').getElementsByClassName(name);

	if(checkbox.checked) {
		for(var i = 0; i < species.length; i++) {
			species[i].checked = true;
		}
	} else {
		for(var i = 0; i < species.length; i++) {
			species[i].checked = false;
		}
	}
}
