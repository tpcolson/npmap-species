var control = {
  _latinFuser: undefined,
  _commonFuser: undefined,
  _nameMappings: undefined,
  _commonToLatin: undefined,
  _selectedSpecies: []
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
  li.onclick = function() {
    clearSearch();
  }
  document.getElementById('search-initial-dropdown-latin').appendChild(li);
  for(var i = 0; i < keys.length; i++) {
    var latin = keys[i];
    var common = control._nameMappings[keys[i]].common;
    var id = control._nameMappings[keys[i]].id;

    li = document.createElement('li');
    li._latin = latin;
    li._id = id;
    li._common = common;
    li.innerHTML = li._latin.replace(/_/g, ' ');
    li.title = li._common.replace(/_/g, ' ');
    li.onclick = function() {
      toggleSearchList();
      selectInitialSpecies(this);
    }
    document.getElementById('search-initial-dropdown-latin').appendChild(li);
  }

  var commonNames = [];
  for(var i = 0; i < keys.length; i++) {
    var common = control._nameMappings[keys[i]].common;
    var latin = keys[i];
    var id = control._nameMappings[keys[i]].id;
    if(!(common in commonNames)) {
      commonNames[common] = [];
    }
    commonNames[common].push({
      _latin: latin,
      _id: id
    });
  }

  keys = [];
  for(key in commonNames) {
    if(key !== 'Unspecified') {
      keys.push(key);
    }
  }
  keys.sort();

  li = document.createElement('li');
  li.innerHTML = 'Clear selection';
  li.onclick = function() {
    clearSearch();
  }
  document.getElementById('search-initial-dropdown-common').appendChild(li);
  for(var i = 0; i < keys.length; i++) {
    var key = keys[i];
    for(var j = 0; j < commonNames[key].length; j++) {
      li = document.createElement('li');
      li._latin = commonNames[key][j]._latin;
      li._id = commonNames[key][j]._id;
      li._common = key;
      li.innerHTML = li._common.replace(/_/g, ' ');
      li.title = li._latin.replace(/_/g, ' ');
      li.onclick = function() {
        toggleSearchList();
        selectInitialSpecies(this);
      }
      document.getElementById('search-initial-dropdown-common').appendChild(li);
    }
  }
}

var listShown = false;
function toggleSearchList() {
  if(!listShown) {
    if(whichName === 'common') {
      $('#search-initial-dropdown-common').stop();
      $('#search-initial-dropdown-common').animate({height: '400px'});
    } else {
      $('#search-initial-dropdown-latin').stop();
      $('#search-initial-dropdown-latin').animate({height: '400px'});
    }
  } else {
    if(whichName === 'common') {
      $('#search-initial-dropdown-common').stop();
      $('#search-initial-dropdown-common').animate({height: '0px'});
    } else {
      $('#search-initial-dropdown-latin').stop();
      $('#search-initial-dropdown-latin').animate({height: '0px'});
    }
  }

  listShown = !listShown;
}

function clearSearch() {
  toggleSearchList();

  // remove all selected species
  document.getElementById('search-initial-dropdown').children[0].innerHTML = 'Select a species';
  document.getElementById('search-initial-dropdown').children[0].title = '';
  document.getElementById('search-initial-dropdown').style.backgroundColor = '#40403d';

  for(var i = 0; i < control._selectedSpecies.length; i++) {
    if(showPredicted) {
      NPMap.config.L.removeLayer(control._selectedSpecies[i].predicted);
    }
    if(showObserved) {
      NPMap.config.L.removeLayer(control._selectedSpecies[i].observed);
    }
  }

  control._selectedSpecies = [];
}

function selectInitialSpecies(li) {
  document.getElementById('search-initial-dropdown').children[0].innerHTML = li.innerHTML;
  document.getElementById('search-initial-dropdown').children[0].title = li.title;
  document.getElementById('search-initial-dropdown').style.backgroundColor = '#40b5c6';

  if(control._selectedSpecies[0] !== undefined) {
    if(showPredicted) {
      NPMap.config.L.removeLayer(control._selectedSpecies[0].predicted);
    }

    if(showObserved) {
      NPMap.config.L.removeLayer(control._selectedSpecies[0].observed);
    }
  }

  control._selectedSpecies[0] = {};
  control._selectedSpecies[0]._id = li._id;
  control._selectedSpecies[0]._latin = li._latin;
  control._selectedSpecies[0]._common = li._common;
  control._selectedSpecies[0].predicted = L.npmap.layer.mapbox({
    name: li._latin,
    opacity: .5,
    id: 'nps.GRSM_' + li._id + '_blue'
  });

  control._selectedSpecies[0].observed = L.npmap.layer.geojson({
    name: li._latin + '_observations',
    url: 'http://nationalparkservice.github.io/npmap-species/atbirecords/Geojsons/all/' + li._latin + '.geojson',
    type: 'geojson',
    popup: {
      title: li._latin.replace(/_/g, ' ') + ' sighting',
      description: 'Coordinates: {{coordinates}}'
    },
    styles: {
      point: {
        'marker-color': '#2b80b6',
        'marker-size': 'small'
      }
    },
    cluster: {
      clusterIcon: '#2b80b6'
    },
    showCoverageOnHover: true,
    disableClusteringAtZoom: 15,
    polygonOptions: {
      color: '#2b80b6',
      fillColor: '#2b80b6'
    }
  });

  if(showPredicted) {
    control._selectedSpecies[0].predicted.addTo(NPMap.config.L);
  }

  if(showObserved) {
    control._selectedSpecies[0].observed.addTo(NPMap.config.L);
  }
}

var searchActive = false;
function toggleLexicalSearch() {
  searchActive = !searchActive;

  if(searchActive) {
    document.getElementById('search-initial-box').style.display = 'block';
    document.getElementById('search-initial-box-input').focus();
  } else {
    document.getElementById('search-initial-box').style.display = 'none';
  }
}

function fuseSearch() {
  var value = document.getElementById('search-initial-box-input').value,
    results = (whichName === 'common')
      ? control._commonFuser.search(value).slice(0, 15)
      : control._latinFuser.search(value).slice(0, 15);

  $('#search-initial-box').stop();
  $('#search-initial-box').animate({
    height: 20+results.length*21 + 'px'
  });

  document.getElementById('search-initial-box').children[1].innerHTML = '';
  for(var i = 0; i < results.length; i++) {
    var li = document.createElement('li');
    li._latin = results[i].latin_name;
    li._id = results[i].irma_id;
    li._common = results[i].common_name;
    if(whichName === 'common') {
      li.innerHTML = li._common.replace(/_/g, ' ');
      li.title = li._latin.replace(/_/g, ' ');
    } else {
      li.innerHTML = li._latin.replace(/_/g, ' ');
      li.title = li._common.replace(/_/g, ' ');
    }
    li.onclick = function() {
      toggleLexicalSearch();
      selectInitialSpecies(this);
    }
    document.getElementById('search-initial-box').children[1].appendChild(li);
  }
}
