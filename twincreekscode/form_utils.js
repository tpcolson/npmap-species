function select_all() {
	update_checkboxes('select');
}

function clear_all() {
	update_checkboxes('clear');
}

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

function update_species() {
}
