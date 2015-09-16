var control = {
  _latinFuser: undefined,
  _commonFuser: undefined,
  _nameMappings: undefined,
  _commonToLatin: undefined,
  _similarDistributions: undefined,
  _selectedSpecies: []
}

function prepareSearchTool() {
  loadResource('http://nationalparkservice.github.io/npmap-species/atbirecords/lexical_index.json', function(data) {
    var index = data.items,
      latinOptions = {
        keys: ['latin_name_ref'],
        threshold: 0.3
      },
      commonOptions = {
        keys: ['common_name'],
        threshold: 0.3
      }

    control._latinFuser = new Fuse(index, latinOptions);
    control._commonFuser = new Fuse(index, commonOptions);
  });

  loadResource('http://nationalparkservice.github.io/npmap-species/atbirecords/irma_mapping.json', function(data) {
    control._nameMappings = data;
    delete control._nameMappings[''];

    populateResults();
  });

  loadResource('http://nationalparkservice.github.io/npmap-species/atbirecords/most_similar_distribution.json', function(data) {
    control._similarDistributions = data;
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

  document.getElementById('search-compare-placeholder').style.display = 'block';
  document.getElementById('search-compare-contents').style.display = 'none';
  document.getElementById('search-initial-image').style.opacity = '0';
}

function selectInitialSpecies(li) {
  clearComparisons();

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
    }/*,
    cluster: {
      clusterIcon: '#000000'
    },
    showCoverageOnHover: true,
    disableClusteringAtZoom: 15,
    polygonOptions: {
      color: '#2b80b6',
      fillColor: '#2b80b6'
    }*/
  });

  if(showPredicted) {
    control._selectedSpecies[0].predicted.addTo(NPMap.config.L);
  }

  if(showObserved) {
    control._selectedSpecies[0].observed.addTo(NPMap.config.L);
  }

  document.getElementById('search-compare-placeholder').style.display = 'none';
  document.getElementById('search-compare-contents').style.display = 'block';
  document.getElementById('search-initial-image').style.opacity = '1';

  populateLists();
}

function populateLists() {
  populateDistributionLists();
  populateEnvironmentLists();
}

function populateDistributionLists() {
  document.getElementById('compare-dist-one').children[2].innerHTML = '';
  document.getElementById('compare-dist-two').children[2].innerHTML = '';

  if(control._selectedSpecies[0] === undefined) {
    return;
  }

  var sp = control._selectedSpecies[0]._latin,
    results = control._similarDistributions[sp],
    found = [
      sp.replace(/_/g, ' '),
      $('#compare-dist-one-name').html(),
      $('#compare-dist-one-name').prop('title'),
      $('#compare-dist-two-name').html(),
      $('#compare-dist-two-name').prop('title')
    ];

    var li = document.createElement('li');
    li.innerHTML = 'Clear selection';
    li.onclick = function() {
      clearCompareOne();
    }
    document.getElementById('compare-dist-one').children[2].appendChild(li);
    li = document.createElement('li');
    li.innerHTML = 'Clear selection';
    li.onclick = function() {
      clearCompareTwo();
    }
    document.getElementById('compare-dist-two').children[2].appendChild(li);

    for(var i = 0; i < 15; i++) {
      var max = -1,
        maxItem = '';
      for(var key in results) {
        if(found.indexOf(key.replace(/_/g, ' ')) === -1) {
          if(results[key] > max) {
            max = results[key];
            maxItem = key;
          }
        }
      }
      found.push(maxItem.replace(/_/g, ' '));

      var latin = maxItem,
        common = control._nameMappings[latin].common,
        id = control._nameMappings[latin].id;

      li = document.createElement('li');
      li._latin = latin;
      li._common = common;
      li._id = id;
      if(whichName === 'common') {
        li.innerHTML = li._common;
        li.title = li._latin.replace(/_/g, ' ');
      } else {
        li.innerHTML = li._latin;
        li.title = li._common.replace(/_/g, ' ');
      }
      li.onclick = function() {
        selectSecondSpecies(this);
      }
      document.getElementById('compare-dist-one').children[2].appendChild(li);

      li = document.createElement('li');
      li._latin = latin;
      li._common = common;
      li._id = id;
      if(whichName === 'common') {
        li.innerHTML = li._common;
        li.title = li._latin.replace(/_/g, ' ');
      } else {
        li.innerHTML = li._latin.replace(/_/g, ' ');
        li.title = li._common;
      }
      li.onclick = function() {
        selectThirdSpecies(this);
      }
      document.getElementById('compare-dist-two').children[2].appendChild(li);
    }
}

function populateEnvironmentLists() {

}

function clearCompareOne() {
  $('#search-compare-one-box-input').val('');
  $('#search-compare-one-box-input').trigger('input');
  $('#search-compare-one-box-name').css({display:'none'});
  $('#search-compare-one-box-clear').css({display:'none'});
  $('#compare-dist-one-name').html('Select a second species');
  $('#compare-dist-one-name').prop('title', '');
  $('#compare-dist-one-name').css({backgroundColor:'#40403d'});

  if(control._selectedSpecies[1] !== undefined) {
    if(showObserved) {
      NPMap.config.L.removeLayer(control._selectedSpecies[1].observed);
    }

    if(showPredicted) {
      NPMap.config.L.removeLayer(control._selectedSpecies[1].predicted);
    }
  }
}

function selectSecondSpecies(li) {
  $('#search-compare-one-box-input').val('');
  $('#search-compare-one-box-input').trigger('input');

  if(whichName === 'common') {
    $('#search-compare-one-box-name').html(li._common);
    $('#search-compare-one-box-name').prop('title', li._latin.replace(/_/g, ' '));
    $('#compare-dist-one-name').html(li._common);
    $('#compare-dist-one-name').prop('title', li._latin.replace(/_/g, ' '));
  } else {
    $('#search-compare-one-box-name').html(li._latin.replace(/_/g, ' '));
    $('#search-compare-one-box-name').prop('title', li._common);
    $('#compare-dist-one-name').html(li._latin.replace(/_/g, ' '));
    $('#compare-dist-one-name').prop('title', li._common);
  }
  $('#search-compare-one-box-name').css({display:'block'});
  $('#search-compare-one-box-clear').css({display:'block'});
  $('#compare-dist-one-name').css({backgroundColor:'#ca1892'});

  if(control._selectedSpecies[1] !== undefined) {
    if(showPredicted) {
      NPMap.config.L.removeLayer(control._selectedSpecies[1].predicted);
    }

    if(showObserved) {
      NPMap.config.L.removeLayer(control._selectedSpecies[1].observed);
    }
  }

  control._selectedSpecies[1] = {};
  control._selectedSpecies[1]._id = li._id;
  control._selectedSpecies[1]._latin = li._latin;
  control._selectedSpecies[1]._common = li._common;
  control._selectedSpecies[1].predicted = L.npmap.layer.mapbox({
    name: li._latin,
    opacity: .5,
    id: 'nps.GRSM_' + li._id + '_pink'
  });

  control._selectedSpecies[1].observed = L.npmap.layer.geojson({
    name: li._latin + '_observations',
    url: 'http://nationalparkservice.github.io/npmap-species/atbirecords/Geojsons/all/' + li._latin + '.geojson',
    type: 'geojson',
    popup: {
      title: li._latin.replace(/_/g, ' ') + ' sighting',
      description: 'Coordinates: {{coordinates}}'
    },
    styles: {
      point: {
        'marker-color': '#ca1892',
        'marker-size': 'small'
      }
    }/**,
    cluster: {
      clusterIcon: '#000000'
    },
    showCoverageOnHover: true,
    disableClusteringAtZoom: 15,
    polygonOptions: {
      color: '#ca1892',
      fillColor: '#ca1892'
    }*/
  });

  if(showPredicted) {
    control._selectedSpecies[1].predicted.addTo(NPMap.config.L);
  }

  if(showObserved) {
    control._selectedSpecies[1].observed.addTo(NPMap.config.L);
  }

  populateDistributionLists();
}

function clearCompareTwo() {
  $('#search-compare-two-box-input').val('');
  $('#search-compare-two-box-input').trigger('input');
  $('#search-compare-two-box-name').css({display:'none'});
  $('#search-compare-two-box-clear').css({display:'none'});
  $('#compare-dist-two-name').html('Select a third species');
  $('#compare-dist-two-name').prop('title', '');
  $('#compare-dist-two-name').css({backgroundColor:'#40403d'});

  if(control._selectedSpecies[2] !== undefined) {
    if(showObserved) {
      NPMap.config.L.removeLayer(control._selectedSpecies[2].observed);
    }

    if(showPredicted) {
      NPMap.config.L.removeLayer(control._selectedSpecies[2].predicted);
    }
  }
}

function selectThirdSpecies(li) {
  $('#search-compare-two-box-input').val('');
  $('#search-compare-two-box-input').trigger('input');

  if(whichName === 'common') {
    $('#search-compare-two-box-name').html(li._common);
    $('#search-compare-two-box-name').prop('title', li._latin.replace(/_/g, ' '));
    $('#compare-dist-two-name').html(li._common);
    $('#compare-dist-two-name').prop('title', li._latin.replace(/_/g, ' '));
  } else {
    $('#search-compare-two-box-name').html(li._latin.replace(/_/g, ' '));
    $('#search-compare-two-box-name').prop('title', li._common);
    $('#compare-dist-two-name').html(li._latin.replace(/_/g, ' '));
    $('#compare-dist-two-name').prop('title', li._common);
  }
  $('#search-compare-two-box-name').css({display:'block'});
  $('#search-compare-two-box-clear').css({display:'block'});
  $('#compare-dist-two-name').css({backgroundColor:'#f28e43'});

  if(control._selectedSpecies[2] !== undefined) {
    if(showPredicted) {
      NPMap.config.L.removeLayer(control._selectedSpecies[2].predicted);
    }

    if(showObserved) {
      NPMap.config.L.removeLayer(control._selectedSpecies[2].observed);
    }
  }

  control._selectedSpecies[2] = {};
  control._selectedSpecies[2]._id = li._id;
  control._selectedSpecies[2]._latin = li._latin;
  control._selectedSpecies[2]._common = li._common;
  control._selectedSpecies[2].predicted = L.npmap.layer.mapbox({
    name: li._latin,
    opacity: .5,
    id: 'nps.GRSM_' + li._id + '_orange'
  });

  control._selectedSpecies[2].observed = L.npmap.layer.geojson({
    name: li._latin + '_observations',
    url: 'http://nationalparkservice.github.io/npmap-species/atbirecords/Geojsons/all/' + li._latin + '.geojson',
    type: 'geojson',
    popup: {
      title: li._latin.replace(/_/g, ' ') + ' sighting',
      description: 'Coordinates: {{coordinates}}'
    },
    styles: {
      point: {
        'marker-color': '#f28e43',
        'marker-size': 'small'
      }
    }/**,
    cluster: {
      clusterIcon: '#000000'
    },
    iconCreateFunction: function() {
      console.log('hello');
    },
    showCoverageOnHover: true,
    disableClusteringAtZoom: 15,
    polygonOptions: {
      color: '#f28e43',
      fillColor: '#f28e43'
    }*/
  });

  if(showPredicted) {
    control._selectedSpecies[2].predicted.addTo(NPMap.config.L);
  }

  if(showObserved) {
    control._selectedSpecies[2].observed.addTo(NPMap.config.L);
  }

  populateDistributionLists();
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

var compareOneActive = false;
function toggleCompareDistOne() {
  compareOneActive = !compareOneActive;

  $('#compare-dist-one').stop();
  if(compareOneActive) {
    $('#compare-dist-one').animate({height:'356px'});
    $('ul', '#compare-dist-one').css({display:'block'});
  } else {
    $('#compare-dist-one').animate({height:'20px'});
    $('ul', '#compare-dist-one').css({display:'none'});
  }
}

var compareTwoActive = false;
function toggleCompareDistTwo() {
  compareTwoActive = !compareTwoActive;

  $('#compare-dist-two').stop();
  if(compareTwoActive) {
    $('#compare-dist-two').animate({height:'356px'});
    $('ul', '#compare-dist-two').css({display:'block'});
  } else {
    $('#compare-dist-two').animate({height:'20px'});
    $('ul', '#compare-dist-two').css({display:'none'});
  }
}

function fuseSearch(idx, value) {
  var value = value,
    results = (whichName === 'common')
      ? control._commonFuser.search(value).slice(0, 15)
      : control._latinFuser.search(value).slice(0, 15);

  switch(idx) {
    case 0:
      elString = '#search-initial-box';
      break;
    case 1:
      elString = '#search-compare-one-box';
      break;
    case 2:
      elString = '#search-compare-two-box';
      break;
    default:
      return;
  }
  $(elString).stop();
  $(elString).animate({
    height: 20+results.length*21 + 'px'
  });

  document.getElementById(elString.substring(1)).children[1].innerHTML = '';
  for(var i = 0; i < results.length; i++) {
    var li = document.createElement('li');
    li._latin = results[i].latin_name;
    li._id = results[i].irma_id;
    li._common = results[i].common_name;
    li._idx = idx;
    if(whichName === 'common') {
      li.innerHTML = li._common.replace(/_/g, ' ');
      li.title = li._latin.replace(/_/g, ' ');
    } else {
      li.innerHTML = li._latin.replace(/_/g, ' ');
      li.title = li._common.replace(/_/g, ' ');
    }
    li.onclick = function() {
      switch(this._idx) {
        case 0:
          toggleLexicalSearch();
          selectInitialSpecies(this);
          break;
        case 1:
          selectSecondSpecies(this);
          break;
        case 2:
          selectThirdSpecies(this);
          break;
        default:
          break;
      }
    }
    document.getElementById(elString.substring(1)).children[1].appendChild(li);
  }
}

function clearComparisons() {
  clearCompareOne();
  clearCompareTwo();
  populateDistributionLists();
}

function lexFocus() {
  clearComparisons();

  $('#search-compare-lexical').animate({width:'481px'});
  $('.subhead', '#search-compare-lexical').css({display:'block'});
  $('.subhead2', '#search-compare-lexical').css({
    top:'5px',
    fontSize:'14pt',
    color:'#f5faf2',
    width:'200px'
  });
  $('.subhead2', '#search-compare-lexical').html('ANOTHER SPECIES IN THE PARK');
  $('#search-compare-one-box').css({display:'block'});
  $('#search-compare-two-box').css({display:'block'});

  $('#search-compare-distribution').animate({width:'120px'});
  $('.subhead', '#search-compare-distribution').css({display:'none'});
  $('.subhead2', '#search-compare-distribution').css({
    top:'25px',
    fontSize:'9pt',
    color:'#909090',
    width:'80px'
  });
  $('.subhead2', '#search-compare-distribution').html('COMPARE DISTRIBUTION');
  $('#compare-dist-one').css({display:'none'});
  $('#compare-dist-two').css({display:'none'});

  $('#search-compare-environment').animate({width:'120px'});
  $('.subhead', '#search-compare-environment').css({display:'none'});
  $('.subhead2', '#search-compare-environment').css({
    top:'25px',
    fontSize:'9pt',
    color:'#909090',
    width:'80px'
  });
  $('.subhead2', '#search-compare-environment').html('COMPARE ENVIRONMENT');
}

function distFocus() {
  clearComparisons();

  $('#search-compare-lexical').animate({width:'121px'});
  $('.subhead', '#search-compare-lexical').css({display:'none'});
  $('.subhead2', '#search-compare-lexical').css({
    top:'25px',
    fontSize:'9pt',
    color:'#909090',
    width:'80px'
  });
  $('.subhead2', '#search-compare-lexical').html('COMPARE SPECIES');
  $('#search-compare-one-box').css({display:'none'});
  $('#search-compare-two-box').css({display:'none'});

  $('#search-compare-distribution').animate({width:'480px'});
  $('.subhead', '#search-compare-distribution').css({display:'block'});
  $('.subhead2', '#search-compare-distribution').css({
    top:'5px',
    fontSize:'14pt',
    color:'#f5faf2',
    width:'200px'
  });
  $('.subhead2', '#search-compare-distribution').html('SPECIES WITH SIMILAR DISTRIBUTION');
  $('#compare-dist-one').css({display:'block'});
  $('#compare-dist-two').css({display:'block'});

  $('#search-compare-environment').animate({width:'120px'});
  $('.subhead', '#search-compare-environment').css({display:'none'});
  $('.subhead2', '#search-compare-environment').css({
    top:'25px',
    fontSize:'9pt',
    color:'#909090',
    width:'80px'
  });
  $('.subhead2', '#search-compare-environment').html('COMPARE ENVIRONMENT');
}

function envFocus() {
  clearComparisons();

  $('#search-compare-lexical').animate({width:'121px'});
  $('.subhead', '#search-compare-lexical').css({display:'none'});
  $('.subhead2', '#search-compare-lexical').css({
    top:'25px',
    fontSize:'9pt',
    color:'#909090',
    width:'80px'
  });
  $('.subhead2', '#search-compare-lexical').html('COMPARE SPECIES');
  $('#search-compare-one-box').css({display:'none'});
  $('#search-compare-two-box').css({display:'none'});

  $('#search-compare-distribution').animate({width:'120px'});
  $('.subhead', '#search-compare-distribution').css({display:'none'});
  $('.subhead2', '#search-compare-distribution').css({
    top:'25px',
    fontSize:'9pt',
    color:'#909090',
    width:'80px'
  });
  $('.subhead2', '#search-compare-distribution').html('COMPARE DISTRIBUTION');
  $('#compare-dist-one').css({display:'none'});
  $('#compare-dist-two').css({display:'none'});

  $('#search-compare-environment').animate({width:'480px'});
  $('.subhead', '#search-compare-environment').css({display:'block'});
  $('.subhead2', '#search-compare-environment').css({
    top:'5px',
    fontSize:'14pt',
    color:'#f5faf2',
    width:'200px'
  });
  $('.subhead2', '#search-compare-environment').html('SPECIES WITH SIMILAR ENVIRONMENT');
}
