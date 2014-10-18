function select_all() {
	update_checkboxes('select');
}

function clear_all() {
	update_checkboxes('clear');
}

function update_checkboxes(option) {
	var form;
	var inputs;

	form = document.forms['submission_form'];
	if(form == null) {
		alert('Couldn\'t grab the form document');
		return;
	}

	inputs = form.getElementsByTagName('input');
	if(inputs == null) {
		alert('Couldn\'t find any form fields');
		return;
	}

	for(var i = 0; i < inputs.length; i++) {
		if(inputs[i].type == 'checkbox') {
			if(!inputs[i].disabled) {
				switch(option) {
					case 'select':
						inputs[i].checked = true;
						break;
					case 'clear':
						inputs[i].checked = false;
						break;
					default:
						break;
				}
			}
		}
	}
}
