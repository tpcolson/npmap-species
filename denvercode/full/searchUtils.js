var control = {
  _latinFuser: undefined,
  _commonFuser: undefined,
  _nameMappings: undefined,
  _commonToLatin: undefined
}

function prepareSearchTool() {
  loadResource('http://nationalparkservice.github.io/npmap-species/atbirecords/lexical_index.json', function(data) {
    var index = data.items,
      latinOptions = {
        keys: ['latin_name_ref'],
        threshold: 0.5
      },
      commonOptions = {
        keys: ['common_name'],
        threshold: 0.5
      }

    control._latinFuser = new Fuse(index, latinOptions);
    control._commonFuser = new Fuse(index, commonOptions);
  });

  loadResource('http://nationalparkservice.github.io/npmap-species/atbirecords/irma_mapping.json', function(data) {
    control._nameMappings = data;
    delete control._nameMappings[''];

    populateResults();
  });
}

function loadResource(url, callback) {
	loadResourceWithTries(url, callback, 1);
}

function loadResourceWithTries(url, callback, tries) {
	jQuery.ajax({
		type: 'GET',
		url: url,
		dataType: 'json',
		success: callback,
		error: function() {
			if(tries < 5) {
				loadResourceWithTries(url, callback, tries+1);
			}
		}
	});
}

function populateResults() {
  var keys = [];
  for(key in control._nameMappings) {
    keys.push(key);
  }
  keys.sort();

  var li = document.createElement('li');
  li.innerHTML = 'Clear selection';
  document.getElementById('search-initial-dropdown-results').appendChild(li);

  for(var i = 0; i < keys.length; i++) {
    li = document.createElement('li');

    li.innerHTML = keys[i].replace(/_/g, ' ');

    document.getElementById('search-initial-dropdown-results').appendChild(li);
  }
}

var listShown = false;
function toggleSearchList() {
  if(!listShown) {
    $('#search-initial-dropdown-results').animate({height: '400px'});
  } else {
    $('#search-initial-dropdown-results').animate({height: '0px'});
  }

  listShown = !listShown;
}
