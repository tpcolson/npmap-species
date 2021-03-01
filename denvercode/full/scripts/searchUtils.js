var control = {
  _latinFuser: undefined,
  _commonFuser: undefined,
  _nameMappings: undefined,
  _commonToLatin: undefined,
  _similarDistributions: undefined,
  _simThreshold: 200,
  _simDistLength: undefined,
  _aucValues: undefined,
  _selectedSpecies: [],
  _lastPredictionState: true,
  _lastObservationState: false
}

function loadResource(url, callback) {
  return new Request({
    retryCount: 5,
    retryTimeout: 50,
    dataType: 'json',
    url: url
  }).done(callback);
}

var can_populate = false;
function prepareSearchTool() {
  var atbi = 'https://tpcolson.github.io/npmap-species/atbirecords/';

  var auc = loadResource(atbi + 'species_auc.json', function (data) {
    control._aucValues = data;
  });

  var similar = loadResource(atbi + 'most_similar_distribution.json', function (data) {
    control._similarDistributions = data;
  });

  var names = $.Deferred();
  loadResource(atbi + 'lexical_index.json', function (data) {
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
    names.resolve();
  });

  // populateResults must have data from the previous requests. we wait for those to finish.
  var isLoaded = $.Deferred();
  $.when(auc, similar, names).done(function () {
    loadResource(atbi + 'irma_mapping.json', function (data) {
      control._nameMappings = data;
      if (control._nameMappings[''])
        delete control._nameMappings[''];
      can_populate = true;
      populateResults();
      isLoaded.resolve();
    });
  });

  return isLoaded;
}


function populateGroupResults() {
  let dropper = document.getElementById('grp-initial-dropdown-select');
  dropper.innerHTML = '';

  var readable = {
    // Not a good overlay... "abundance": "Abundance",
    "bloomtime": "Bloomtime",
    "elevationrange": "Elevation Range",
    "lifeform": "Lifeform",
    // Not a good overlay... "nativeness": "Nativeness",
    // Not a good overlay... "speciesrecordstatus": "Species Record Status",
    "taxagroup": "Taxagroup",
    "taxasubcategory": "Taxa Subgroup"
  }

  for (const key in group_mappings) {
    let readkey = key;
    if (key in readable) {
      readkey = readable[key];
    } else {
      continue;
    }
    let li = document.createElement('li');
    li.onclick = li.onkeypress = function () {
      selectGroup(this);
    }
    li.innerText = readkey;
    li.setAttribute('data-group', key);
    li.setAttribute('data-group-id', key);
    dropper.appendChild(li);
  }
}

var populated = false;
function populateResults() {
  if (activeViewElemID === 'group-spec-view')
    populateGroupResults();
  if (!can_populate || activeViewElemID != 'single-spec-view')
    return;
  var keys = [];
  var commonKeys = [];
  for (key in control._nameMappings) {
    keys.push(key);
    commonKeys.push([control._nameMappings[key].common, key]);
  }
  keys.sort();
  commonKeys.sort(function (a, b) {
    return a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0;
  });

  document.getElementById('search-initial-dropdown-select').innerHTML = '';
  document.getElementById('search-compare-one-dropdown-select').innerHTML = '';
  document.getElementById('search-compare-two-dropdown-select').innerHTML = '';
  var li = document.createElement('li');
  var li1 = document.createElement('li');
  var li2 = document.createElement('li');
  li.innerHTML = 'Clear selection';
  li.onclick = li.onkeypress = function () {
    toggleSearchList(0);
    clearSearch();
  }
  li1.innerHTML = 'Clear selection';
  li1.onclick = li1.onkeypress = function () {
    toggleSearchList(1);
    clearCompareOne();
  }
  li2.innerHTML = 'Clear selection';
  li2.onclick = li1.onkeypress = function () {
    toggleSearchList(2);
    clearCompareTwo();
  }
  document.getElementById('search-initial-dropdown-select').appendChild(li);
  document.getElementById('search-compare-one-dropdown-select').appendChild(li1);
  document.getElementById('search-compare-two-dropdown-select').appendChild(li2);
  if (whichName === 'latin') {
    for (var i = 0; i < keys.length; i++) {
      var latin = keys[i];
      var common = control._nameMappings[keys[i]].common;
      var id = control._nameMappings[keys[i]].id;

      li = document.createElement('li');
      li._latin = latin;
      li._id = id;
      li._common = common;
      li1 = document.createElement('li');
      li1._latin = latin;
      li1._id = id;
      li1._common = common;
      li2 = document.createElement('li');
      li2._latin = latin;
      li2._id = id;
      li2._common = common;

      if (whichName === 'latin') {
        li.innerHTML = li._latin.replace(/_/g, ' ');
        li.title = li._common.replace(/_/g, ' ');
        li1.innerHTML = li1._latin.replace(/_/g, ' ');
        li1.title = li1._common.replace(/_/g, ' ');
        li2.innerHTML = li2._latin.replace(/_/g, ' ');
        li2.title = li2._common.replace(/_/g, ' ');
      } else {
        li.innerHTML = li._common.replace(/_/g, ' ');
        li.title = li._latin.replace(/_/g, ' ');
        li1.innerHTML = li1._common.replace(/_/g, ' ');
        li1.title = li1._latin.replace(/_/g, ' ');
        li2.innerHTML = li2._common.replace(/_/g, ' ');
        li2.title = li2._latin.replace(/_/g, ' ');
      }

      li.onclick = li.onkeypress = function () {
        toggleSearchList(0);
        selectInitialSpecies(this);
      }
      li1.onclick = li1.onkeypress = function () {
        toggleSearchList(1);
        selectSecondSpecies(this);
      }
      li2.onclick = li2.onkeypress = function () {
        toggleSearchList(2);
        selectThirdSpecies(this);
      }

      document.getElementById('search-initial-dropdown-select').appendChild(li);
      document.getElementById('search-compare-one-dropdown-select').appendChild(li1);
      document.getElementById('search-compare-two-dropdown-select').appendChild(li2);
    }
  } else {
    for (var i = 0; i < commonKeys.length; i++) {
      var latin = commonKeys[i][1];
      var common = commonKeys[i][0];
      var id = control._nameMappings[latin].id;

      li = document.createElement('li');
      li._latin = latin;
      li._id = id;
      li._common = common;
      li1 = document.createElement('li');
      li1._latin = latin;
      li1._id = id;
      li1._common = common;
      li2 = document.createElement('li');
      li2._latin = latin;
      li2._id = id;
      li2._common = common;

      if (whichName === 'latin') {
        li.innerHTML = li._latin.replace(/_/g, ' ');
        li.title = li._common.replace(/_/g, ' ');
        li1.innerHTML = li1._latin.replace(/_/g, ' ');
        li1.title = li1._common.replace(/_/g, ' ');
        li2.innerHTML = li2._latin.replace(/_/g, ' ');
        li2.title = li2._common.replace(/_/g, ' ');
      } else {
        li.innerHTML = li._common.replace(/_/g, ' ');
        li.title = li._latin.replace(/_/g, ' ');
        li1.innerHTML = li1._common.replace(/_/g, ' ');
        li1.title = li1._latin.replace(/_/g, ' ');
        li2.innerHTML = li2._common.replace(/_/g, ' ');
        li2.title = li2._latin.replace(/_/g, ' ');
      }

      li.onclick = li.onkeypress = function () {
        toggleSearchList(0);
        selectInitialSpecies(this);
      }
      li1.onclick = li1.onkeypress = function () {
        toggleSearchList(1);
        selectSecondSpecies(this);
      }
      li2.onclick = li2.onkeypress = function () {
        $('body').trigger('tooltip-loaded');
        toggleSearchList(2);
        selectThirdSpecies(this);
      }

      document.getElementById('search-initial-dropdown-select').appendChild(li);
      document.getElementById('search-compare-one-dropdown-select').appendChild(li1);
      document.getElementById('search-compare-two-dropdown-select').appendChild(li2);
    }
  }

  populated = true;
  $('#search-tool').trigger('loaded');
}

var list0Shown = false,
  list1Shown = false,
  list2Shown = false,
  list3Shown = false,
  list4Shown = false,
  list5Shown = false,
  list6Shown = false,
  list7Shown = false;
function toggleSearchList(idx, callback) {
  switch (idx) {
    case 0:
      if (!list0Shown) {
        $('#search-initial-dropdown').css({ 'border-radius': '4px 4px 0px 0px' });
        $('#search-initial-dropdown-lex').stop();
        $('#search-initial-dropdown-lex').animate({ height: '0px' });
        $('#search-initial-dropdown-select').stop();
        $('#search-initial-dropdown-select').animate({ height: '400px' }, callback);
      } else {
        $('#search-initial-dropdown').css({ 'border-radius': '4px' });
        $('#search-initial-dropdown-select').stop();
        $('#search-initial-dropdown-select').animate({ height: '0px' }, callback);
      }

      list0Shown = !list0Shown;
      break;

    case 1:
      $('#search-compare-two-dropdown').css({ 'border-radius': '4px 4px 4px 4px' });
      $('#search-compare-two-dropdown-lex').stop();
      $('#search-compare-two-dropdown-lex').animate({ height: '0px' });
      $('#search-compare-two-dropdown-select').stop();
      $('#search-compare-two-dropdown-select').animate({ height: '0px' });

      if (!list1Shown) {
        $('#search-compare-one-dropdown').css({ 'border-radius': '4px 4px 0px 0px' });
        $('#search-compare-one-dropdown-lex').stop();
        $('#search-compare-one-dropdown-lex').animate({ height: '0px' });
        $('#search-compare-one-dropdown-select').stop();
        $('#search-compare-one-dropdown-select').animate({ height: '400px' }, callback);
      } else {
        $('#search-compare-one-dropdown').css({ 'border-radius': '4px' });
        $('#search-compare-one-dropdown-select').stop();
        $('#search-compare-one-dropdown-select').animate({ height: '0px' }, callback);
      }

      list1Shown = !list1Shown;
      break;

    case 2:
      if (!list2Shown) {
        $('#search-compare-two-dropdown').css({ 'border-radius': '4px 4px 0px 0px' });
        $('#search-compare-two-dropdown-lex').stop();
        $('#search-compare-two-dropdown-lex').animate({ height: '0px' });
        $('#search-compare-two-dropdown-select').stop();
        $('#search-compare-two-dropdown-select').animate({ height: '400px' }, callback);
      } else {
        $('#search-compare-two-dropdown').css({ 'border-radius': '4px' });
        $('#search-compare-two-dropdown-select').stop();
        $('#search-compare-two-dropdown-select').animate({ height: '0px' }, callback);
      }

      list2Shown = !list2Shown;

    case 3:
      if (!list3Shown) {
        $('#grp-initial-dropdown').css({ 'border-radius': '4px 4px 0px 0px' });
        $('#grp-initial-dropdown-lex').stop();
        $('#grp-initial-dropdown-lex').animate({ height: '0px' });
        $('#grp-initial-dropdown-select').stop();
        let len = $('#grp-initial-dropdown-select').children().length * 21;
        len = Math.min(len, 400);
        $('#grp-initial-dropdown-select').animate({ height: len + 'px' }, callback);
      } else {
        $('#grp-initial-dropdown').css({ 'border-radius': '4px' });
        $('#grp-initial-dropdown-select').stop();
        $('#grp-initial-dropdown-select').animate({ height: '0px' }, callback);
      }

      list3Shown = !list3Shown;
      break;

    case 4:
      if (!list4Shown) {
        $('#subgrp-initial-dropdown').css({ 'border-radius': '4px 4px 0px 0px' });
        $('#subgrp-initial-dropdown-lex').stop();
        $('#subgrp-initial-dropdown-lex').animate({ height: '0px' });
        $('#subgrp-initial-dropdown-select').stop();
        let len = $('#subgrp-initial-dropdown-select').children().length * 21;
        len = Math.min(len, 400);
        $('#subgrp-initial-dropdown-select').animate({ height: len + 'px' }, callback);
      } else {
        $('#subgrp-initial-dropdown').css({ 'border-radius': '4px' });
        $('#subgrp-initial-dropdown-select').stop();
        $('#subgrp-initial-dropdown-select').animate({ height: '0px' }, callback);
      }

      list4Shown = !list4Shown;
      break;

    case 5:
      if (!list5Shown) {
        $('#search-compare-grp1-dropdown').css({ 'border-radius': '4px 4px 0px 0px' });
        $('#search-compare-grp1-dropdown-lex').stop();
        $('#search-compare-grp1-dropdown-lex').animate({ height: '0px' });
        $('#search-compare-grp1-dropdown-select').stop();
        let len = $('#search-compare-grp1-dropdown-select').children().length * 21;
        len = Math.min(len, 400);
        $('#search-compare-grp1-dropdown-select').animate({ height: len + 'px' }, callback);
      } else {
        $('#search-compare-grp1-dropdown').css({ 'border-radius': '4px' });
        $('#search-compare-grp1-dropdown-select').stop();
        $('#search-compare-grp1-dropdown-select').animate({ height: '0px' }, callback);
      }

      list5Shown = !list5Shown;
      break;

    case 6:
      if (!list6Shown) {
        $('#search-compare-grp2-dropdown').css({ 'border-radius': '4px 4px 0px 0px' });
        $('#search-compare-grp2-dropdown-lex').stop();
        $('#search-compare-grp2-dropdown-lex').animate({ height: '0px' });
        $('#search-compare-grp2-dropdown-select').stop();
        let len = $('#search-compare-grp2-dropdown-select').children().length * 21;
        len = Math.min(len, 400);
        $('#search-compare-grp2-dropdown-select').animate({ height: len + 'px' }, callback);
      } else {
        $('#search-compare-grp2-dropdown').css({ 'border-radius': '4px' });
        $('#search-compare-grp2-dropdown-select').stop();
        $('#search-compare-grp2-dropdown-select').animate({ height: '0px' }, callback);
      }

      list6Shown = !list6Shown;
      break;

    case 7:
      if (!list7Shown) {
        $('#search-compare-grp3-dropdown').css({ 'border-radius': '4px 4px 0px 0px' });
        $('#search-compare-grp3-dropdown-lex').stop();
        $('#search-compare-grp3-dropdown-lex').animate({ height: '0px' });
        $('#search-compare-grp3-dropdown-select').stop();
        let len = $('#search-compare-grp3-dropdown-select').children().length * 21;
        len = Math.min(len, 400);
        $('#search-compare-grp3-dropdown-select').animate({ height: len + 'px' }, callback);
      } else {
        $('#search-compare-grp3-dropdown').css({ 'border-radius': '4px' });
        $('#search-compare-grp3-dropdown-select').stop();
        $('#search-compare-grp3-dropdown-select').animate({ height: '0px' }, callback);
      }

      list7Shown = !list7Shown;
      break;
    default:
      break;
  }
}

function closeSearchList(idx, callback) {
  switch (idx) {
    case 0:
      $('#search-initial-dropdown').css({ 'border-radius': '4px' });
      $('#search-initial-dropdown-select').stop();
      $('#search-initial-dropdown-select').animate({ height: '0px' }, callback);
      list0Shown = false;
      break;

    case 1:
      $('#search-compare-one-dropdown').css({ 'border-radius': '4px' });
      $('#search-compare-one-dropdown-select').stop();
      $('#search-compare-one-dropdown-select').animate({ height: '0px' }, callback);
      list1Shown = false;
      break;

    case 2:
      $('#search-compare-two-dropdown').css({ 'border-radius': '4px' });
      $('#search-compare-two-dropdown-select').stop();
      $('#search-compare-two-dropdown-select').animate({ height: '0px' }, callback);
      list2Shown = false;

    case 3:
      $('#grp-initial-dropdown').css({ 'border-radius': '4px' });
      $('#grp-initial-dropdown-select').stop();
      $('#grp-initial-dropdown-select').animate({ height: '0px' }, callback);
      list3Shown = false;
      break;

    case 4:
      $('#subgrp-initial-dropdown').css({ 'border-radius': '4px' });
      $('#subgrp-initial-dropdown-select').stop();
      $('#subgrp-initial-dropdown-select').animate({ height: '0px' }, callback);
      list4Shown = false;
      break;

    case 5:
      $('#search-compare-grp1-dropdown').css({ 'border-radius': '4px' });
      $('#search-compare-grp1-dropdown-select').stop();
      $('#search-compare-grp1-dropdown-select').animate({ height: '0px' }, callback);
      list5Shown = false
      break;

    case 6:
      $('#search-compare-grp2-dropdown').css({ 'border-radius': '4px' });
      $('#search-compare-grp2-dropdown-select').stop();
      $('#search-compare-grp2-dropdown-select').animate({ height: '0px' }, callback);
      list6Shown = false;
      break;

    case 7:
      $('#search-compare-grp3-dropdown').css({ 'border-radius': '4px' });
      $('#search-compare-grp3-dropdown-select').stop();
      $('#search-compare-grp3-dropdown-select').animate({ height: '0px' }, callback);
      list7Shown = false;
      break;
    default:
      break;
  }
}

function clearSearch() {

  for (var i = 0; i < control._selectedSpecies.length; i++) {
    if (control._selectedSpecies[i] !== undefined) {
      recordAction('removed species', control._selectedSpecies[i]._latin.replace(/_/g, ' '));

      if (showPredicted) {
        NPMap.config.L.removeLayer(control._selectedSpecies[i].predicted);
      }

      if (showObserved && i == 0) {
        NPMap.config.L.removeLayer(control._selectedSpecies[i].observed);
      }
    }
  }

  control._selectedSpecies = [];

  if (control._lastPredictionState === false) {
    document.getElementById('options-predicted-checkbox').disabled = false;
    $('#options-predicted-checkbox').trigger('click');
  }

  $('#color-legend').hide();

  $("#search-image-box").css({
    "background-image": "none",
    "pointer-events": "none"
  });
  $(".search-image-box-magnifier").hide();

  $("#search-tool-contents").animate({
    "width": "1330px"
  });

  if (activeViewElemID == 'single-spec-view') return;

  document.getElementById('options-predicted-checkbox').disabled = true;
  document.getElementById('options-observed-checkbox').disabled = true;

  document.getElementById('search-initial-dropdown').children[0].innerHTML = '';
  document.getElementById('search-initial-dropdown').children[0].title = '';
  document.getElementById('search-initial-dropdown').style.backgroundColor = '#40403d';
  $('.dropdown-input', '#search-initial-dropdown').css({ 'background-color': '#40403d' });
  $('.dropdown-input', '#search-initial-dropdown').val('');

  $('#search-initial-altname').html('');

  $('#search-compare-lexical').stop();
  $('#search-compare-lexical').animate({ 'width': '240px' });
  $('#search-compare-one-box').css({ display: 'none' });
  $('#search-compare-two-box').css({ display: 'none' });
  $('#search-compare-one-dropdown').css({ display: 'none' });
  $('#search-compare-two-dropdown').css({ display: 'none' });
  $('.subhead', '#search-compare-lexical').css({
    display: 'block',
    color: 'rgb(144, 144, 144)'
  });
  $('.subhead2', '#search-compare-lexical').css({
    top: '5px',
    fontSize: '14px',
    color: 'rgb(144, 144, 144)',
    width: '200px'
  });
  $('.subhead2', '#search-compare-lexical').html('ANOTHER SPECIES');

  $('#search-compare-distribution').stop();
  $('#search-compare-distribution').animate({ 'width': '240px' });
  $('#compare-dist-one').css({ display: 'none' });
  $('#compare-dist-two').css({ display: 'none' });
  $('.subhead', '#search-compare-distribution').css({
    display: 'block',
    color: 'rgb(144, 144, 144)'
  });
  $('.subhead2', '#search-compare-distribution').css({
    top: '5px',
    fontSize: '14px',
    color: 'rgb(144, 144, 144)',
    width: '200px'
  });
  $('.subhead2', '#search-compare-distribution').html('SPECIES WITH SIMILAR DISTRIBUTION');

  $('input:radio[name=comparator]').prop('checked', false);
  $('input:radio[name=comparator]').prop('disabled', true);

  $('#search-initial-image').css({ 'opacity': 0.0 });
}

function selectInitialSpecies(li) {
  recordAction('added species', li._latin.replace(/_/g, ' '));
  clearComparisons();

  // change the main thumbnail
  var url = getThumbnailURL(li._latin);
  var image = new Image();
  image.onload = function () {
    $("#search-image-box").css({
      "background-image": "url(" + url + ")",
      "background-size": "contain",
      "background-position": "center",
    });
  }
  image.src = url;

  // default image in case the real one didn't load
  $("#search-image-box").css({
    "background-image": "url(images/no_image.jpg)"
  });
  $(".search-image-box-magnifier").show();
  $(".search-image-box-magnifier").css({ "display": "inline-block" });

  $("#search-tool-contents").animate({
    "width": "1175px"
  });

  document.getElementById('search-initial-dropdown').style.backgroundColor = 'rgb(202, 24, 146)';

  // Populate Species Density box legend item
  if (whichName === 'latin') {
    document.getElementById('legend-pink-contents-name').innerHTML = li._latin.replace(/_/g, ' ');
    document.getElementById('legend-pink-contents-name').title = li._common.replace(/_/g, ' ');
  } else {
    document.getElementById('legend-pink-contents-name').innerHTML = li._common.replace(/_/g, ' ');
    document.getElementById('legend-pink-contents-name').title = li._latin.replace(/_/g, ' ');
  }
  $('#legend-species-pink').addClass('populated');

  if (control._selectedSpecies[0] !== undefined && control._selectedSpecies[0].visible) {
    recordAction('removed species', control._selectedSpecies[0]._latin.replace(/_/g, ' '));

    if (showPredicted) {
      NPMap.config.L.removeLayer(control._selectedSpecies[0].predicted);
    }

    if (showObserved) {
      NPMap.config.L.removeLayer(control._selectedSpecies[0].observed);
    }
  }

  control._selectedSpecies[0] = {};
  control._selectedSpecies[0]._id = li._id;
  control._selectedSpecies[0]._latin = li._latin;
  control._selectedSpecies[0]._common = li._common;
  control._selectedSpecies[0].visible = true;

  control._selectedSpecies[0].observed = createPopup(li);

  document.getElementById('options-predicted-checkbox').disabled = false;
  document.getElementById('options-observed-checkbox').disabled = false;

  if (whichName === 'latin') {
    $('#search-initial-altname').html(control._selectedSpecies[0]._common.replace(/_/g, ' '));
    $('.dropdown-input', '#search-initial-dropdown').val(control._selectedSpecies[0]._latin.replace(/_/g, ' '));
  } else {
    $('#search-initial-altname').html(control._selectedSpecies[0]._latin.replace(/_/g, ' '));
    $('.dropdown-input', '#search-initial-dropdown').val(control._selectedSpecies[0]._common.replace(/_/g, ' '));
  }
  $('.dropdown-input', '#search-initial-dropdown').css({ 'background-color': '#c91892' });

  drawData();
  if (showObserved) {
    control._selectedSpecies[0].observed.addTo(NPMap.config.L);
  }

  findAUC(0, li._latin);

  $('#color-legend').show();
  $('input', '#legend-pink-controls').prop('checked', true);

  $('.subhead').css({
    color: '#f5faf2'
  });
  $('.subhead2').css({
    color: '#f5faf2',
  });

  $('input:radio[name=comparator]').prop('disabled', false);
  $('#search-initial-image').css({ 'opacity': 1.0 });

  populateLists();
}

function populateLists() {
  populateDistributionLists();
}

function populateDistributionLists() {
  document.getElementById('compare-dist-one').children[2].innerHTML = '';
  document.getElementById('compare-dist-two').children[2].innerHTML = '';

  if (control._selectedSpecies[0] === undefined || !control._similarDistributions) {
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
  li.onclick = li.onkeypress = function () {
    clearCompareOne();
  }
  document.getElementById('compare-dist-one').children[2].appendChild(li);
  li = document.createElement('li');
  li.innerHTML = 'Clear selection';
  li.onclick = li.onkeypress = function () {
    clearCompareTwo();
  }
  document.getElementById('compare-dist-two').children[2].appendChild(li);

  for (var i = 0; i < 15; i++) {
    var max = -1,
      maxItem = '';
    for (var key in results) {
      if (found.indexOf(key.replace(/_/g, ' ')) === -1) {
        if (results[key] > max && results[key] > control._simThreshold && (whichName === 'latin' || control._nameMappings[key].common !== 'Unspecified')) {
          max = results[key];
          maxItem = key;
        }
      }
    }

    if (results[maxItem] > control._simThreshold) {
      found.push(maxItem.replace(/_/g, ' '));

      var latin = maxItem,
        common = control._nameMappings[latin].common,
        id = control._nameMappings[latin].id;

      li = document.createElement('li');
      li._latin = latin;
      li._common = common;
      li._id = id;
      if (whichName === 'common') {
        li.innerHTML = li._common;
        li.title = li._latin.replace(/_/g, ' ');
      } else {
        li.innerHTML = li._latin.replace(/_/g, ' ');
        li.title = li._common;
      }
      li.onclick = li.onkeypress = function () {
        selectSecondSpecies(this);
      }
      document.getElementById('compare-dist-one').children[2].appendChild(li);

      li = document.createElement('li');
      li._latin = latin;
      li._common = common;
      li._id = id;
      if (whichName === 'common') {
        li.innerHTML = li._common;
        li.title = li._latin.replace(/_/g, ' ');
      } else {
        li.innerHTML = li._latin.replace(/_/g, ' ');
        li.title = li._common;
      }
      li.onclick = li.onkeypress = function () {
        selectThirdSpecies(this);
      }
      document.getElementById('compare-dist-two').children[2].appendChild(li);
    }
  }

  control._simDistLength = found.length;
  $('#compare-dist-one').stop();
  if (compareDistOneActive) {
    $('#compare-dist-one').animate({ height: ((control._simDistLength - 5) * 21 + 41) + 'px' });
    $('ul', '#compare-dist-one').css({ display: 'block' });
  }
  $('#compare-dist-two').stop();
  if (compareDistTwoActive) {
    $('#compare-dist-two').animate({ height: ((control._simDistLength - 5) * 21 + 41) + 'px' });
    $('ul', '#compare-dist-two').css({ display: 'block' });
  }
}

function clearCompareOne() {
  document.getElementById('search-compare-one-dropdown').style.backgroundColor = '#40403d';
  $('.dropdown-input', '#search-compare-one-dropdown').css({ 'background-color': '#40403d' });
  $('.dropdown-input', '#search-compare-one-dropdown').val('');

  $('#legend-species-orange').removeClass('populated');
  // $('#legend-species-orange').animate({
  //   height: '0px',
  //   marginBottom: '0px'
  // });

  if (control._selectedSpecies[1] !== undefined)
    recordAction('removed species', control._selectedSpecies[1]._latin.replace(/_/g, ' '));

  $('#search-compare-one-box-input').val('');
  $('#search-compare-one-box-input').trigger('input');
  $('#search-compare-one-box-name').css({ display: 'none' });
  $('#search-compare-one-box-clear').css({ display: 'none' });
  $('#compare-dist-one-name').html('Select a second species');
  $('#compare-dist-one-name').prop('title', '');
  $('#compare-dist-one-name').css({ backgroundColor: '#40403d' });

  if (control._selectedSpecies[1] !== undefined) {
    if (showPredicted) {
      NPMap.config.L.removeLayer(control._selectedSpecies[1].predicted);
    }
  }

  control._selectedSpecies[1] = undefined;

  if (control._selectedSpecies[2] === undefined) {
    document.getElementById('options-predicted-checkbox').disabled = false;
    document.getElementById('options-observed-checkbox').disabled = false;

    if (control._lastPredictionState === false) {
      control._lastPredictionState = true;
      $('#options-predicted-checkbox').trigger('click');
    }

    if (control._lastObservationState === true) {
      control._lastObservationState = false;
      $('#options-observed-checkbox').trigger('click');
    }
  }

  populateDistributionLists();
}

function selectSecondSpecies(li) {
  recordAction('added species', li._latin.replace(/_/g, ' '));

  $('#legend-species-orange').addClass('populated');

  var common = li._common.replace(/_/g, ' ');
  var latin = li._latin.replace(/_/g, ' ');

  var label = whichName === 'common' ? common : latin;
  var title = whichName === 'common' ? latin : common;

  var legend_node = document.getElementById('legend-orange-contents-name');
  legend_node.innerHTML = label;
  legend_node.title = title;

  $('.dropdown-input', '#search-compare-one-dropdown').val(label);
  $('.dropdown-input', '#search-compare-one-dropdown').prop('title', title);
  $('#compare-dist-one-name').html(common);
  $('#compare-dist-one-name').prop('title', latin);

  $('#search-compare-one-dropdown').css({ backgroundColor: 'rgb(242, 142, 67)' });
  $('.dropdown-input', '#search-compare-one-dropdown').css({ backgroundColor: 'rgb(242, 142, 67)' });
  fuseSearch(1, '');

  $('#search-compare-one-box-name').css({ display: 'block' });
  $('#search-compare-one-box-clear').css({ display: 'block' });
  $('#compare-dist-one-name').css({ backgroundColor: 'rgb(242, 142, 67)' });

  if (control._selectedSpecies[1] !== undefined && control._selectedSpecies[1].visible) {
    recordAction('removed species', control._selectedSpecies[1]._latin.replace(/_/g, ' '));

    if (showPredicted) {
      NPMap.config.L.removeLayer(control._selectedSpecies[1].predicted);
    }
  }

  control._selectedSpecies[1] = {};
  control._selectedSpecies[1]._id = li._id;
  control._selectedSpecies[1]._latin = li._latin;
  control._selectedSpecies[1]._common = li._common;
  control._selectedSpecies[1].visible = true;

  if (!showPredicted) {
    control._lastPredictionState = false;
    $('#options-predicted-checkbox').trigger('click');
  }

  if (showObserved) {
    control._lastObservationState = true;
    $('#options-observed-checkbox').trigger('click');
  }
  document.getElementById('options-predicted-checkbox').disabled = true;
  document.getElementById('options-observed-checkbox').disabled = true;

  drawData();

  findAUC(1, li._latin);

  $('input', '#legend-orange-controls').prop('checked', true);

  populateDistributionLists();
}

function clearCompareTwo() {
  document.getElementById('search-compare-two-dropdown').style.backgroundColor = '#40403d';
  $('.dropdown-input', '#search-compare-two-dropdown').css({ 'background-color': '#40403d' }).val('');

  $('#legend-species-blue').removeClass('populated');

  if (control._selectedSpecies[2] !== undefined)
    recordAction('removed species', control._selectedSpecies[2]._latin.replace(/_/g, ' '));

  $('#search-compare-two-box-input').val('').trigger('input');
  $('#search-compare-two-box-name').css({ display: 'none' });
  $('#search-compare-two-box-clear').css({ display: 'none' });
  $('#compare-dist-two-name')
    .html('Select a third species')
    .prop('title', '')
    .css({ backgroundColor: '#40403d' });

  if (control._selectedSpecies[2] !== undefined) {
    recordAction('removed species', control._selectedSpecies[2]._latin.replace(/_/g, ' '));

    if (showPredicted) {
      NPMap.config.L.removeLayer(control._selectedSpecies[2].predicted);
    }
  }

  control._selectedSpecies[2] = undefined;

  if (control._selectedSpecies[1] === undefined) {
    document.getElementById('options-predicted-checkbox').disabled = false;
    document.getElementById('options-observed-checkbox').disabled = false;

    if (control._lastPredictionState === false) {
      control._lastPredictionState = true;
      $('#options-predicted-checkbox').trigger('click');
    }

    if (control._lastObservationState === true) {
      control._lastObservationState = false;
      $('#options-observed-checkbox').trigger('click');
    }
  }

  populateDistributionLists();
}

function selectThirdSpecies(li) {
  recordAction('added species', li._latin.replace(/_/g, ' '));

  $('#legend-species-blue').addClass('populated');

  var common = li._common.replace(/_/g, ' ');
  var latin = li._latin.replace(/_/g, ' ');

  var label = whichName === 'common' ? common : latin;
  var title = whichName === 'common' ? latin : common;

  var legend_node = document.getElementById('legend-blue-contents-name');
  legend_node.innerHTML = label;
  legend_node.title = title;

  $('.dropdown-input', '#search-compare-two-dropdown').val(label);
  $('.dropdown-input', '#search-compare-two-dropdown').prop('title', title);
  $('#search-compare-two-box-name')
    .html(label)
    .prop('title', title)
    .css({ display: 'block' });
  $('#search-compare-two-box-clear').css({ display: 'block' });

  $('#compare-dist-two-name')
    .html(label)
    .prop('title', title)
    .css({ backgroundColor: 'rgb(29, 144, 156)' });

  if (control._selectedSpecies[2] !== undefined && control._selectedSpecies[2].visible) {
    if (showPredicted) {
      NPMap.config.L.removeLayer(control._selectedSpecies[2].predicted);
    }
  }

  control._selectedSpecies[2] = {};
  control._selectedSpecies[2]._id = li._id;
  control._selectedSpecies[2]._latin = li._latin;
  control._selectedSpecies[2]._common = li._common;
  control._selectedSpecies[2].visible = true;

  if (!showPredicted) {
    control._lastPredictionState = false;
    $('#options-predicted-checkbox').trigger('click');
  }
  if (showObserved) {
    control._lastObservationState = true;
    $('#options-observed-checkbox').trigger('click');
  }
  document.getElementById('options-predicted-checkbox').disabled = true;
  document.getElementById('options-observed-checkbox').disabled = true;

  $('#search-compare-two-dropdown').css({ backgroundColor: 'rgb(29, 144, 156)' });
  $('.dropdown-input', '#search-compare-two-dropdown').css({ backgroundColor: 'rgb(29, 144, 156)' });
  fuseSearch(2, '');

  drawData();

  findAUC(2, li._latin);

  $('input', '#legend-blue-controls').prop('checked', true);

  populateDistributionLists();
}

var searchActive = false;
function toggleLexicalSearch() {
  searchActive = !searchActive;

  if (searchActive) {
    if (listShown) {
      toggleSearchList(function () {
        document.getElementById('search-initial-box').style.display = 'block';
        document.getElementById('search-initial-box-input').focus();
      });
    } else {
      document.getElementById('search-initial-box').style.display = 'block';
      document.getElementById('search-initial-box-input').focus();
    }
  } else {
    document.getElementById('search-initial-box').style.display = 'none';
  }
}

var compareDistOneActive = false;
function toggleCompareDistOne() {
  if (compareDistTwoActive) {
    toggleCompareDistTwo();
  }

  compareDistOneActive = !compareDistOneActive;

  $('#compare-dist-one').stop();
  if (compareDistOneActive) {
    $('#compare-dist-one').animate({ height: ((control._simDistLength - 5) * 21 + 41) + 'px' });
    $('ul', '#compare-dist-one').css({ display: 'block' });
  } else {
    $('#compare-dist-one').animate({ height: '20px' });
    $('ul', '#compare-dist-one').css({ display: 'none' });
  }
}

var compareDistTwoActive = false;
function toggleCompareDistTwo() {
  compareDistTwoActive = !compareDistTwoActive;

  $('#compare-dist-two').stop();
  if (compareDistTwoActive) {
    $('#compare-dist-two').animate({ height: ((control._simDistLength - 5) * 21 + 41) + 'px' });
    $('ul', '#compare-dist-two').css({ display: 'block' });
  } else {
    $('#compare-dist-two').animate({ height: '20px' });
    $('ul', '#compare-dist-two').css({ display: 'none' });
  }
}

function fuseSearch(idx, value, expand) {
  var value = value,
    commonResults = control._commonFuser.search(value),
    latinResults = control._latinFuser.search(value),
    results = (whichName === 'common')
      ? commonResults.slice(0, 15)
      : latinResults.slice(0, 15);

  /* replace unspecified names */
  if (whichName === 'common') {
    var j = 15;
    for (var i = 0; i < results.length; i++) {
      if (results[i].common_name === 'Unspecified') {
        while (commonResults[j].common_name === 'Unspecified') {
          j++;
        }
        results[i] = commonResults[j];
        j++;
      }
    }
  }

  /* for species comparison searches, remove species already selected from search results */
  if (idx === 1 || idx === 2) {
    for (var i = 0; i < results.length; i++) {
      for (var j = 0; j < control._selectedSpecies.length; j++) {
        if (control._selectedSpecies[j] !== undefined) {
          if (results[i].latin_name === control._selectedSpecies[j]._latin) {
            results.splice(i--, 1);
          }
        }
      }
    }
  }

  switch (idx) {
    case 0:
      $('#search-initial-dropdown-select').stop();
      $('#search-initial-dropdown-select').animate({ height: '0px' });
      elString = '#search-initial-dropdown-lex';
      break;
    case 1:
      $('#search-compare-one-dropdown-select').stop();
      $('#search-compare-one-dropdown-select').animate({ height: '0px' });
      elString = '#search-compare-one-dropdown-lex';
      break;
    case 2:
      $('#search-compare-two-dropdown-select').stop();
      $('#search-compare-two-dropdown-select').animate({ height: '0px' });
      elString = '#search-compare-two-dropdown-lex';
      break;
    default:
      return;
  }

  $(elString).stop();
  if (expand === undefined || expand) {
    $(elString).animate({
      height: (results.length * 21) + 'px'
    });
    $(elString).parent().css({ 'border-radius': '4px 4px 0px 0px' });
  } else {
    $(elString).animate({
      height: '0px'
    });
    $(elString).parent().css({ 'border-radius': '4px 4px 4px 4px' });
  }

  if (results.length === 0) {
    $(elString).parent().css({ 'border-radius': '4px 4px 4px 4px' });
    return;
  }

  document.getElementById(elString.substring(1)).innerHTML = '';
  for (var i = 0; i < results.length; i++) {
    var li = document.createElement('li');
    li._latin = results[i].latin_name;
    li._id = results[i].irma_id;
    li._common = results[i].common_name;
    li._idx = idx;
    if (whichName === 'common') {
      li.innerHTML = li._common.replace(/_/g, ' ');
      li.title = li._latin.replace(/_/g, ' ');
    } else {
      li.innerHTML = li._latin.replace(/_/g, ' ');
      li.title = li._common.replace(/_/g, ' ');
    }
    //Moa:: instead of this, delegation should've been used
    li.onclick = li.onkeypress = function () {
      switch (this._idx) {
        case 0:
          fuseSearch(0, '', false);
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
    document.getElementById(elString.substring(1)).appendChild(li);
  }
}

function clearComparisons() {
  clearCompareOne();
  clearCompareTwo();
  $('#color-legend').stop();
  $('#color-legend').show();
  populateDistributionLists();
}

var lexFocussed = false;
var distFocussed = false;
function lexFocus() {
  clearComparisons();

  $('#search-compare-lexical').animate({ width: '440px' });
  $('.subhead', '#search-compare-lexical').css({ display: 'block' });
  $('.subhead2', '#search-compare-lexical').css({
    top: '5px',
    fontSize: '14px',
    color: '#f5faf2',
    width: '200px'
  });
  $('.subhead2', '#search-compare-lexical').html('ANOTHER SPECIES');
  $('#search-compare-one-box').css({ display: 'block' });
  $('#search-compare-two-box').css({ display: 'block' });

  $('#search-compare-distribution').animate({ width: '120px' });
  $('.subhead', '#search-compare-distribution').css({ display: 'none' });
  $('.subhead2', '#search-compare-distribution').css({
    color: '#909090',
    width: '80px'
  });
  $('.subhead2', '#search-compare-distribution').html('COMPARE DISTRIBUTION');
  $('#compare-dist-one').css({ display: 'none' });
  $('#compare-dist-two').css({ display: 'none' });
  $('#search-compare-one-dropdown').css({ 'display': 'block' });
  $('#search-compare-two-dropdown').css({ 'display': 'block' });
  $('.dropdown-input', '#search-compare-one-dropdown').focus();
  lexFocussed = true;
  distFocussed = false;

  $('#lexical-radio').prop('checked', true);
}

function distFocus() {
  clearComparisons();

  $('#search-compare-lexical').animate({ width: '121px' });
  $('.subhead', '#search-compare-lexical').css({ display: 'none' });
  $('.subhead2', '#search-compare-lexical').css({
    color: '#909090',
    width: '80px'
  });
  $('.subhead2', '#search-compare-lexical').html('COMPARE SPECIES');
  $('#search-compare-one-box').css({ display: 'none' });
  $('#search-compare-two-box').css({ display: 'none' });

  $('#search-compare-distribution').animate({ width: '440px' });
  $('.subhead', '#search-compare-distribution').css({ display: 'block' });
  $('.subhead2', '#search-compare-distribution').css({
    top: '5px',
    fontSize: '14px',
    color: '#f5faf2',
    width: '200px'
  });
  $('.subhead2', '#search-compare-distribution').html('SPECIES WITH SIMILAR DISTRIBUTION');
  $('#compare-dist-one').css({ display: 'block' });
  $('#compare-dist-two').css({ display: 'block' });
  $('#search-compare-one-dropdown').css({ 'display': 'none' });
  $('#search-compare-two-dropdown').css({ 'display': 'none' });
  lexFocussed = false;
  distFocussed = true;

  $('#dist-radio').prop('checked', true);
}

function findAUC(idx, name) {
  if (!control._aucValues)
    return;

  var color;
  switch (idx) {
    case 0:
      color = 'pink';
      break;
    case 1:
      color = 'orange';
      break;
    case 2:
      color = 'blue';
      break;
    default:
      return;
  }

  var valueStr = control._aucValues[name];
  if (valueStr !== undefined) {
    var value = parseFloat(valueStr);
    if (value < 0.7) {
      $('#legend-' + color + '-quality').html('Poor');
    } else if (value < 0.8) {
      $('#legend-' + color + '-quality').html('Average');
    } else if (value < 0.9) {
      $('#legend-' + color + '-quality').html('Good');
    } else {
      $('#legend-' + color + '-quality').html('Excellent');
    }
  } else {
    $('#legend-' + color + '-quality').html('Unknown');
  }
}

function toggleSpecies(idx) {
  control._selectedSpecies[idx].visible = !control._selectedSpecies[idx].visible;

  if (control._selectedSpecies[idx].visible) {
    if (showPredicted) {
      drawData();
    }

    if (showObserved) {
      control._selectedSpecies[idx].observed.addTo(NPMap.config.L);
    }
  } else {
    if (showPredicted) {
      NPMap.config.L.removeLayer(control._selectedSpecies[idx].predicted);
    }

    if (showObserved) {
      NPMap.config.L.removeLayer(control._selectedSpecies[idx].observed);
    }
  }
}

function closeDropdowns() {
  $('#search-initial-dropdown').css({ 'border-radius': '4px 4px 4px 4px' });
  $('#search-initial-dropdown-lex').stop();
  $('#search-initial-dropdown-lex').animate({ height: '0px' });
  $('#search-initial-dropdown-select').stop();
  $('#search-initial-dropdown-select').animate({ height: '0px' });

  $('#search-compare-one-dropdown').css({ 'border-radius': '4px 4px 4px 4px' });
  $('#search-compare-one-dropdown-lex').stop();
  $('#search-compare-one-dropdown-lex').animate({ height: '0px' });
  $('#search-compare-one-dropdown-select').stop();
  $('#search-compare-one-dropdown-select').animate({ height: '0px' });

  $('#search-compare-two-dropdown').css({ 'border-radius': '4px 4px 4px 4px' });
  $('#search-compare-two-dropdown-lex').stop();
  $('#search-compare-two-dropdown-lex').animate({ height: '0px' });
  $('#search-compare-two-dropdown-select').stop();
  $('#search-compare-two-dropdown-select').animate({ height: '0px' });
  $('#compare-dist-one').stop();
  $('#compare-dist-one').animate({ height: '20px' });
  $('ul', '#compare-dist-one').css({ display: 'none' });

  $('#compare-dist-two').stop();
  $('#compare-dist-two').animate({ height: '20px' });
  $('ul', '#compare-dist-two').css({ display: 'none' });

  if (showBackground) {
    toggleBackgroundList();
  }

  if (showOverlayList) {
    toggleOverlayList();
  }

  list0Shown = list1Shown = list2Shown = compareDistOneActive = compareDistTwoActive = false;
}

function clearGroupSelect() {
  selectGroup({ innerHTML: 'clear-selection' });
  populateSubGrpSelect(undefined);
}

function clearSubGroupSelect() {
  selectSubGroup({ innerHTML: 'clear-selection' });
  last_grp = undefined;
  last_sub = undefined;
  populateSpeciesSelect(undefined);
}

function clearSpeciesSelect(idx) {
  if (idx) {
    const specieIndex = idx - 1;
    selectSpeciesOfGroup({ innerHTML: 'clear-selection' }, idx);
    if (control._selectedSpecies[specieIndex] !== undefined) {
      recordAction('removed species', control._selectedSpecies[specieIndex]._latin.replace(/_/g, ' '));

      if (showPredicted) {
        NPMap.config.L.removeLayer(control._selectedSpecies[specieIndex].predicted);
      }

      if (showObserved && i == 0) {
        NPMap.config.L.removeLayer(control._selectedSpecies[specieIndex].observed);
      }
    }
    return;
  }
  selectSpeciesOfGroup({ innerHTML: 'clear-selection' }, 1);
  selectSpeciesOfGroup({ innerHTML: 'clear-selection' }, 2);
  selectSpeciesOfGroup({ innerHTML: 'clear-selection' }, 3);

  for (var i = 0; i < control._selectedSpecies.length; i++) {
    if (control._selectedSpecies[i] !== undefined) {
      recordAction('removed species', control._selectedSpecies[i]._latin.replace(/_/g, ' '));

      if (showPredicted) {
        NPMap.config.L.removeLayer(control._selectedSpecies[i].predicted);
      }

      if (showObserved && i == 0) {
        NPMap.config.L.removeLayer(control._selectedSpecies[i].observed);
      }
    }
  }

  $('#legend-species-pink').removeClass('populated');
  $('#legend-species-orange').removeClass('populated');
  $('#legend-species-blue').removeClass('populated');
  control._selectedSpecies = [];

}

/* PPPH */
function selectGroup(li) {
  let name = li.innerHTML;
  let grp_id = $(li).attr('data-group');
  let grpSelect = $('#dropdown-grp-input');
  clearSubGroupSelect();
  if (name != 'clear-selection') {
    if (grp_id) {
      populateSubGrpSelect(grp_id);
      $('#subgrp-initial-dropdown').css({ visibility: 'inherit' });
    }
    grpSelect.val(li.innerHTML);
    return;
  }
  grpSelect.val("");
  $('#subgrp-initial-dropdown').css({ visibility: 'hidden' });
}

function populateSubGrpSelect(grp_id) {
  $('#subgrp-initial-dropdown-select').empty();
  let clearBinds = `onkeypress='clearSubGroupSelect()' onclick='clearSubGroupSelect()'`;
  $('#subgrp-initial-dropdown-select').append(`<li data-subgroup="null" data-group="null" ${clearBinds}>Clear Selection</li>`)
  if (!group_mappings[grp_id]) return;
  let funcBinds = `onkeypress='selectSubGroup(this)' onclick='selectSubGroup(this)'`;
  for (subgrp_id in group_mappings[grp_id]) {
    if (group_mappings[grp_id][subgrp_id].length < 1) continue;
    let name = subgrp_id.charAt(0).toUpperCase() + subgrp_id.slice(1);
    $('#subgrp-initial-dropdown-select').append(`<li data-subgroup="${subgrp_id}" data-group="${grp_id}" ${funcBinds}>${name}</li>`)
  }
}

function selectSubGroup(li) {
  let name = li.innerHTML;
  let grp_id = $(li).attr('data-group');
  let subgrp_id = $(li).attr('data-subgroup');
  let grpSelect = $('#dropdown-subgrp-input');
  clearSpeciesSelect();
  if (name != 'clear-selection') {
    if (grp_id && subgrp_id) {
      populateSpeciesSelect(grp_id, subgrp_id);
      $('#search-compare-gv-contents').css({ visibility: 'inherit' });
    }
    const id = 2;

    if (control._selectedSpecies[id] !== undefined && control._selectedSpecies[id].visible) {
      recordAction('removed species', control._selectedSpecies[id]._latin.replace(/_/g, ' '));

      if (showPredicted) {
        NPMap.config.L.removeLayer(control._selectedSpecies[id].predicted);
      }

      if (showObserved) {
        NPMap.config.L.removeLayer(control._selectedSpecies[id].observed);
      }
    }

    let grp_name = $(li).attr('data-group');
    let sgrp_name = $(li).attr('data-subgroup');
    let specid = 'grp';
    control._selectedSpecies[id] = {};
    control._selectedSpecies[id]._id = specid;
    control._selectedSpecies[id]._latin = grp_name;
    control._selectedSpecies[id]._common = sgrp_name;
    control._selectedSpecies[id].visible = true;

    $('#legend-species-blue').addClass('populated');
    $('#legend-blue-contents-name').html('Group Map');

    drawData();
    grpSelect.val(li.innerHTML);
    $('#color-legend').show();
    return;
  }
  $('#search-compare-gv-contents').css({ visibility: 'hidden' });
  grpSelect.val("");
}

var group_name_convention = 'common';
var last_grp = undefined;
var last_sub = undefined;
function populateSpeciesSelect(grp_id, subgrp_id) {
  $('#dropdown-grp1-input').val("").css({ backgroundColor: '#40403d' });
  $('#dropdown-grp2-input').val("").css({ backgroundColor: '#40403d' });
  $('#dropdown-grp3-input').val("").css({ backgroundColor: '#40403d' });

  $('#search-compare-grp1-dropdown-select').empty();
  $('#search-compare-grp1-dropdown').css({ backgroundColor: '#40403d' });
  $('#search-compare-grp2-dropdown-select').empty();
  $('#search-compare-grp2-dropdown').css({ backgroundColor: '#40403d' });
  $('#search-compare-grp3-dropdown-select').empty();
  $('#search-compare-grp3-dropdown').css({ backgroundColor: '#40403d' });

  if (!group_mappings[grp_id]) return;
  let clearBinds1 = `onkeypress='clearSpeciesSelect(1)' onclick='clearSpeciesSelect(1)'`;
  let clearBinds2 = `onkeypress='clearSpeciesSelect(2)' onclick='clearSpeciesSelect(2)'`;
  let clearBinds3 = `onkeypress='clearSpeciesSelect(3)' onclick='clearSpeciesSelect(3)'`;
  $('#search-compare-grp1-dropdown-select').append(`<li data-subgroup="null" data-group="null" data-name="null" ${clearBinds1}>Clear Selection</li>`);
  $('#search-compare-grp2-dropdown-select').append(`<li data-subgroup="null" data-group="null" data-name="null" ${clearBinds2}>Clear Selection</li>`);
  $('#search-compare-grp3-dropdown-select').append(`<li data-subgroup="null" data-group="null" data-name="null" ${clearBinds3}>Clear Selection</li>`);
  let funcBinds1 = `onkeypress='selectSpeciesOfGroup(this, 1);' onclick='selectSpeciesOfGroup(this, 1);'`;
  let funcBinds2 = `onkeypress='selectSpeciesOfGroup(this, 2);' onclick='selectSpeciesOfGroup(this, 2);'`;
  let funcBinds3 = `onkeypress='selectSpeciesOfGroup(this, 3);' onclick='selectSpeciesOfGroup(this, 3);'`;
  for (const key of group_mappings[grp_id][subgrp_id]) {
    let latin_name = id_to_specie[key].latin;
    let common_name = id_to_specie[key].common;
    let display_name = common_name.charAt(0).toUpperCase() + common_name.slice(1);
    if (group_name_convention !== 'common') {
      display_name  = latin_name.replace(/_/g, ' ');
    }
    if (!(latin_name in specie_id_map)) continue;
    $('#search-compare-grp1-dropdown-select').append(`<li data-subgroup="${subgrp_id}" data-group="${grp_id}" data-name="${latin_name}" ${funcBinds1}>${display_name}</li>`);
    $('#search-compare-grp2-dropdown-select').append(`<li data-subgroup="${subgrp_id}" data-group="${grp_id}" data-name="${latin_name}" ${funcBinds2}>${display_name}</li>`);
    $('#search-compare-grp3-dropdown-select').append(`<li data-subgroup="${subgrp_id}" data-group="${grp_id}" data-name="${latin_name}" ${funcBinds3}>${display_name}</li>`);
  }
  last_grp = grp_id;
  last_sub = subgrp_id;
}

function toggleNameGroup() {
  group_name_convention === 'common' ? group_name_convention = 'latin' : group_name_convention = 'common';
  if (!last_sub || !last_grp) return;
  clearSpeciesSelect();
  populateSpeciesSelect(last_grp, last_sub);
  $('#search-compare-gv-contents').css({ visibility: 'inherit' }); 
  const id = 2;

  if (control._selectedSpecies[id] !== undefined && control._selectedSpecies[id].visible) {
    recordAction('removed species', control._selectedSpecies[id]._latin.replace(/_/g, ' '));

    if (showPredicted) {
      NPMap.config.L.removeLayer(control._selectedSpecies[id].predicted);
    }

    if (showObserved) {
      NPMap.config.L.removeLayer(control._selectedSpecies[id].observed);
    }
  }

  let grp_name = last_grp;
  let sgrp_name = last_sub;
  let specid = 'grp';
  control._selectedSpecies[id] = {};
  control._selectedSpecies[id]._id = specid;
  control._selectedSpecies[id]._latin = grp_name;
  control._selectedSpecies[id]._common = sgrp_name;
  control._selectedSpecies[id].visible = true;
  $('#legend-species-blue').addClass('populated');
  $('#legend-blue-contents-name').html('Group Map');

  drawData();
  return;
}

function selectSpeciesOfGroup(li, idx) {
  for (let i = 0; i < 3; ++i) {
    let lat_name = $(li).attr('data-name');
    if (control._selectedSpecies[i] && lat_name && control._selectedSpecies[i]._latin == lat_name){
      return;
    }
  }

  let name = li.innerHTML;
  let spcString = '#dropdown-grp' + idx + '-input';
  let prntString = '#search-compare-grp' + idx + '-dropdown';
  let spcSelect = $(spcString);
  let prntDiv = $(prntString);
  let colortag = undefined;
  let nametag = undefined;
  let color = undefined;
  switch (idx) {
    case 1:
      color = '#C91792';
      colortag = '#legend-species-pink';
      nametag = '#legend-pink-contents-name';
      break;
    case 2:
      color = '#F28E42';
      colortag = '#legend-species-orange';
      nametag = '#legend-orange-contents-name';
      break;
    case 3:
      color = '#1F909C';
      colortag = '#legend-species-blue';
      nametag = '#legend-blue-contents-name';
      break;
    default:
      break;
  }
  if (name == 'clear-selection') {
    spcSelect.css({ backgroundColor: '#40403d' });
    prntDiv.css({ backgroundColor: '#40403d' });
    $(colortag).removeClass('populated');
    spcSelect.val("");
    return;
  }
  spcSelect.val(li.innerHTML);
  spcSelect.css({ backgroundColor: color });
  prntDiv.css({ backgroundColor: color });

  const id = idx - 1;

  if (control._selectedSpecies[id] !== undefined && control._selectedSpecies[id].visible) {
    recordAction('removed species', control._selectedSpecies[id]._latin.replace(/_/g, ' '));

    if (showPredicted) {
      NPMap.config.L.removeLayer(control._selectedSpecies[id].predicted);
    }

    if (showObserved) {
      NPMap.config.L.removeLayer(control._selectedSpecies[id].observed);
    }
  }

  let lat_name = $(li).attr('data-name');
  let cmn_name = li.innerHTML;
  let specid = specie_id_map[lat_name].padStart(7, '0');
  control._selectedSpecies[id] = {};
  control._selectedSpecies[id]._id = specid;
  control._selectedSpecies[id]._latin = lat_name;
  control._selectedSpecies[id]._common = cmn_name;
  control._selectedSpecies[id].visible = true;
  $(nametag).html(name);
  $(colortag).addClass('populated');
  toggleSearchList(idx + 4);
  drawData();
}
