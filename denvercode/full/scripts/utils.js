$(document).ready(function () {
  document.getElementById('options-predicted-checkbox').checked = true;
  document.getElementById('options-observed-checkbox').checked = false;
  $('#search-tool').one('loaded', function () { loadSettings(); });
  setTimeout(hacks, 2000);
});

window.onload = function () {
  /* Move zoom and measure controls directly below search tool */
  attemptExecute(function () {
    var el = document.getElementsByClassName('leaflet-top leaflet-left')[0];
    var searchBar = document.getElementById('search-tool');

    if (el === undefined || searchBar === undefined) {
      return false;
    } else {
      el.style.top = window.getComputedStyle(searchBar).getPropertyValue('height');
      return true;
    }
  });

  /* Remove default base layer switcher */
  attemptExecute(function () {
    if (document.getElementsByClassName('npmap-control-switcher')[0] === undefined) {
      return false;
    }

    $(document.getElementsByClassName('npmap-control-switcher')[0]).remove();
    return true;
  });

  /* turn off overlays by default */
  attemptExecute(function () {
    if (NPMap === undefined || NPMap.config === undefined || NPMap.config.overlays === undefined || NPMap.config.L === undefined) {
      return false;
    }

    for (var i = 0; i < NPMap.config.overlays.length; i++) {
      var overlay = NPMap.config.overlays[i];

      if (overlay.name === 'Trails' || overlay.name === 'Visitor Centers' || overlay.name === 'Roads' || overlay.name === 'Shelters' || overlay.name === 'Campsites') {
        overlay.visible = false;
        NPMap.config.L.removeLayer(overlay.L);
      }
    }

    return true;
  });


  /* prepare print tool */
  attemptExecute(function () {
    if (!(NPMap && NPMap.config && NPMap.config.L && NPMap.config.L.printControl && NPMap.config.L.printControl.print)) {
      return false;
    }

    var printContainer = L.DomUtil.create('div', 'leaflet-bar leaflet-control npmap-control-print'),
      bg = $('.npmap-toolbar .right li button.print').css('background-image');

    $('.leaflet-top.leaflet-left').append($(printContainer));
    $(printContainer).append($('.npmap-toolbar .right li button'));
    $('.npmap-map-wrapper').css({ 'top': '0px' });
    $('.npmap-control-print button').css({
      'background-image': bg,
      'background-repeat': 'no-repeat',
      'background-position': 'center',
      'border-top': '1px solid #1a2423',
      'height': '26px'
    });

    return true;
  });

  /* set up drawing tooltips */
  attemptExecute(function () {
    if ($('button.marker').get(0) === undefined || $('button.polyline').get(0) === undefined || $('button.circle').get(0) === undefined) {
      return false;
    }

    $('button.marker').get(0).setAttribute('tooltip', 'Press here, then click on the map to place a marker');
    $('button.polyline').get(0).setAttribute('tooltip', 'Press here, then click on the map to draw a path');
    $('button.circle').get(0).setAttribute('tooltip', 'Press here, then click and drag on the map to draw a circle');

    return true;
  });

  /* prepare search tool */
  prepareSearchTool().done(function () {

    /* prepare color legend dragging */
    prepareLegendDrag();

    /* prepare tooltips */
    $tooltips._initialize(document.body);
  });

  /* prepare date conversion utility */
  setInterval(function () {
    var item = $('.layer > .content > .description').get(0);
    if (item !== undefined) {
      if (!processed) {
        if (endsWith(item.innerHTML, '<a target="_blank" href="https://www.nps.gov/grsm/learn/nature/research.htm">Contribute to this dataset</a>')) {
          var tokens = item.innerHTML.split(' ');
          if (tokens[5] !== undefined) {
            var newDate = new Date(parseInt(tokens[5]));
          }
          $(item).html(item.innerHTML.replace(tokens[5], newDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }) + ','));
          processed = true;
        }
      }
    } else {
      processed = false;
    }
  }, 100);

  $('.dropdown-input', '#search-initial-dropdown').focus();
  attemptExecute(function () {
    if ($('.leaflet-control-attribution').get(0) === undefined)
      return false;

    $('.leaflet-control-attribution').get(0).innerHTML = '<a href="https://github.com/nationalparkservice/npmap-species/issues?q=is%3Aissue+is%3Aopen+-label%3A508+-label%3Adeployment+-label%3Aduplicate+-label%3Awontfix" target="_blank">Report an Issue</a> | ' + $('.leaflet-control-attribution').get(0).innerHTML;
    return true;
  });

  /* prepare the image modal */
  // Get the modal
  var modal = document.getElementById('image-modal');

  // Get the image and insert it inside the modal - use its "alt" text as a caption
  var image_box = document.getElementById('search-image-box');
  var modalImg = document.getElementById("image-modal-image");
  image_box.onclick = function () {
    modal.style.display = "block";
    var url = this.style.backgroundImage.replace("url(\"", "").replace("\")", "");
    //url = url.replace("/thumbnails", ""); // load full quality image
    url = url.replace('110px', '800px');
    url = url.replace('thumbmedium.png?', 'original.jpg?');
    modalImg.src = url;
  }

  // Get the <span> element that closes the modal
  var span = document.getElementsByClassName("close")[0];

  // When the user clicks on <span> (x), close the modal
  span.onclick = function () {
    modal.style.display = "none";
  }

  $("#dropdown-initial-input").focus();
  setImageHovers();
}

var processed = false;

function attemptExecute(fn) {
  if (!fn()) {
    setTimeout(fn, 50);
  }
}

function endsWith(str, suffix) {
  return str.indexOf(suffix, str.length - suffix.length) !== -1;
}

/* Converts latin name to thumbnail URL */
function getThumbnailURL(latin_name) {
  var url = '';
  if (latin_name !== undefined) {
    //    let latinURL = '/species_images/thumbnails/' + latin_name.toLowerCase().replace(" ", "_") + '.jpg';
    if (tax_json[latin_name] !== undefined) {
      url = 'images/' + tax_json[latin_name] + '_110px.jpg'
    }
  }
  return url;
}

/* quick hacks by Moa for the mockup versions */
function hacks() {
  $(".leaflet-control-edit button").each(function () {
    $(this).addClass("hidden-buttons");
  });
  var edit_button = $("<button>")
    .addClass("fa fa-pencil edit-pencil hack-round")
    .prependTo(".leaflet-control-edit");

  edit_button.on("click", function () {
    $(".hidden-buttons").slideToggle();
    $(this).toggleClass("hack-round");
  });
  $(".hidden-buttons").slideToggle();
}

/* The setup that's needed for thumbnail image hovers */
function setImageHovers() {
  // add the image thumbnail tag
  var img = $('<img>').attr('id', 'species-hover-thumbnail')
    .appendTo('body');

  // if the image doesn't load, show a fallback image
  img.on('error', function () {
    $(this).attr('src', 'images/no_image.jpg');
  });

  $('ul.species-list').on('mouseover', 'li', function (e) {
    if (this.innerText == 'Clear selection') return;
    $("#species-hover-thumbnail").css({ display: 'block' });
    var latin_name = whichName == 'latin' ? this.innerHTML : 'No image';
    var url = getThumbnailURL(this._latin);
    $('#species-hover-thumbnail').attr('src', url);

    // if the thumbnail is somewhere else, bring it here first
    // then animate
    var pos_x = $("#species-hover-thumbnail").offset().left;
    var new_x = $(this).offset().left + $(this).parent().outerWidth();
    if (Math.abs(pos_x - new_x) > 0.5) {
      $("#species-hover-thumbnail").css({
        left: new_x + 'px'
      });
    }
    $("#species-hover-thumbnail").stop().animate({
      top: $(this).offset().top + 'px',
      left: new_x + 'px'
    }, 50);
  });

  $('ul.species-list').on('mouseout', function () {
    $("#species-hover-thumbnail").css({ display: 'none' });
  });
  $('ul.species-list').on('click', function (e) {
    $("#species-hover-thumbnail").css({ display: 'none' });
    if (e.toElement.innerHTML == 'Clear selection') return;
    $("#search-image-box").css({
      "pointer-events": "auto"
    });
  });

}

var tooltipsEnabled = true;
function toggleTooltips() {
  $tooltips._toggleTooltips();

  var tooltipsButton = document.getElementById('search-banner-help-tooltips').children[0].children[0];
  if (tooltipsEnabled) {
    recordAction('tooltips turned off');
    $('#search-banner-tooltips-button').children().stop();
    $('#search-banner-tooltips-button').children().animate({ left: '0px' });
  } else {
    recordAction('tooltips turned on');
    $('#search-banner-tooltips-button').children().stop();
    $('#search-banner-tooltips-button').children().animate({ left: '37.5px' });
  }

  tooltipsEnabled = !tooltipsEnabled;
}

function showHelp() {
  closeDropdowns();

  recordAction('showed help overlay');
  if (minimized) {
    toggleMinimized();

    setTimeout(function () {
      $('body').chardinJs('start');
    }, 200);
  } else {
    $('body').chardinJs('start');
  }
}

var minimized = false,
  currentBaseLayer = undefined;
function toggleMinimized() {
  var minButton = document.getElementById('search-banner-help-minimizer-button');
  if (!minimized) {
    recordAction('minimized toolbar');
    $('body').chardinJs('stop');
    minButton.innerHTML = 'Expand';
    $('#search-tool').css({ overflow: 'hidden' });
    $('#search-tool').stop();
    $('.leaflet-top.leaflet-left').stop();
    $('#search-tool').animate({ height: '0px' });
    $('.leaflet-top.leaflet-left').animate({ top: '40px' });
  } else {
    recordAction('expanded toolbar');
    minButton.innerHTML = 'Collapse';
    $('#search-tool').stop();
    $('.leaflet-top.leaflet-left').stop();
    $('#search-tool').animate({ height: '127px' }, function () {
      $('#search-tool').css({ overflow: 'visible' });
    });
    $('.leaflet-top.leaflet-left').animate({ top: '127px' });
  }

  minimized = !minimized;
}

var lastBaseIndex = 0;
function updateBaseLayer(idx) {
  if (idx !== lastBaseIndex) {
    /* remove last layer (taken from NPMap.js switcher.js) */
    $('#options-background-dropdown-ul').get(0).children[lastBaseIndex].innerHTML = $('#options-background-dropdown-ul').get(0).children[lastBaseIndex].innerHTML.substring(2, $('#options-background-dropdown-ul').get(0).children[lastBaseIndex].innerHTML.length);
    NPMap.config.baseLayers[lastBaseIndex].visible = false;
    NPMap.config.L.removeLayer(NPMap.config.baseLayers[lastBaseIndex].L);

    /* add new layer (taken from NPMap.js switcher.js) */
    recordAction('changed base layer', $('#options-background-dropdown-ul').get(0).children[idx].innerHTML);
    $('#options-background-dropdown-ul').get(0).children[idx].innerHTML = '\u2714 ' + $('#options-background-dropdown-ul').get(0).children[idx].innerHTML;
    var newLayer = NPMap.config.baseLayers[idx];
    if (newLayer.type === 'arcgisserver') {
      newLayer.L = L.npmap.layer[newLayer.type][newLayer.tiled === true ? 'tiled' : 'dynamic'](newLayer);
    } else {
      newLayer.L = L.npmap.layer[newLayer.type](newLayer);
    }
    newLayer.visible = true;
    currentBaseLayer = newLayer.L;
    NPMap.config.L.addLayer(newLayer.L);

    lastBaseIndex = idx;

    $('.leaflet-control-attribution').get(0).innerHTML = '<a href="https://github.com/nationalparkservice/npmap-species/issues?q=is%3Aissue+is%3Aopen+-label%3A508+-label%3Adeployment+-label%3Aduplicate+-label%3Awontfix" target="_blank">Report an Issue</a> | ' + $('.leaflet-control-attribution').get(0).innerHTML;
  }
}

function toggleOverlay(idx) {
  var overlay = NPMap.config.overlays[idx],
    text = $('#options-overlays-dropdown-ul').get(0).children[idx].innerHTML;
  if (text.charAt(0) !== '\u2714') {
    recordAction('turned on overlay', text);
    $('#options-overlays-dropdown-ul').get(0).children[idx].innerHTML = '\u2714 ' + text;
    overlay.visible = true;
    NPMap.config.L.addLayer(overlay.L);
  } else {
    recordAction('turned off overlay', text.substring(2, text.length));
    $('#options-overlays-dropdown-ul').get(0).children[idx].innerHTML = text.substring(2, text.length);
    overlay.visible = false;
    NPMap.config.L.removeLayer(overlay.L);
  }
}

var showPredicted = true;
function togglePredicted() {
  showPredicted = !showPredicted;

  if (showPredicted) {
    recordAction('turned on predicted data');
    drawData();
  } else {
    recordAction('turned off predicted data');
    for (var i = 0; i < control._selectedSpecies.length; i++) {
      if (control._selectedSpecies[i] !== undefined && control._selectedSpecies[i].visible) {
        NPMap.config.L.removeLayer(control._selectedSpecies[i].predicted);
      }
    }
  }
}

var showObserved = false;
function toggleObserved() {
  showObserved = !showObserved;

  if (showObserved) {
    recordAction('turned on observed data');
  } else {
    recordAction('turned off observed data');
  }

  for (var i = 0; i < control._selectedSpecies.length; i++) {
    if (control._selectedSpecies[i] !== undefined && control._selectedSpecies[i].visible) {
      if (showObserved) {
        control._selectedSpecies[i].observed.addTo(NPMap.config.L);
      } else if (i == 0) {
        NPMap.config.L.removeLayer(control._selectedSpecies[i].observed);
      }
    }
  }
}

var showBackground = false;
function toggleBackgroundList() {
  if (showOverlayList) {
    toggleOverlayList();
  }

  showBackground = !showBackground;

  if (showBackground) {
    $('#options-background-dropdown').stop();
    $('#options-background-dropdown').animate({ 'height': '105px' });
    $('#options-background-dropdown-ul').css({ 'display': 'block' });
  } else {
    $('#options-background-dropdown').stop();
    $('#options-background-dropdown').animate({ 'height': '20px' });
    $('#options-background-dropdown-ul').css({ 'display': 'none' });
  }
}

var showOverlayList = false;
function toggleOverlayList() {
  showOverlayList = !showOverlayList;

  if (showOverlayList) {
    $('#options-overlays-dropdown').stop();
    $('#options-overlays-dropdown').animate({ 'height': '126px' });
    $('#options-overlays-dropdown-ul').css({ 'display': 'block' });
  } else {
    $('#options-overlays-dropdown').stop();
    $('#options-overlays-dropdown').animate({ 'height': '20px' });
    $('#options-overlays-dropdown-ul').css({ 'display': 'none' });
  }
}

var showSelectBackground = false;
function toggleSelectBackgroundList() {

  showSelectBackground = !showSelectBackground;

  if (showSelectBackground) {
    $('#options-selectbackground-dropdown').stop();
    $('#options-selectbackground-dropdown').animate({ 'height': '60px' });
    $('#options-selectbackground-dropdown-ul').css({ 'display': 'block' });
  } else {
    $('#options-selectbackground-dropdown').stop();
    $('#options-selectbackground-dropdown').animate({ 'height': '20px' });
    $('#options-selectbackground-dropdown-ul').css({ 'display': 'none' });
  }
}

var showSelectViewing = false;
function toggleSelectViewingList() {

  showSelectViewing = !showSelectViewing;

  if (showSelectViewing) {
    $('#options-selectviewing-dropdown').stop();
    $('#options-selectviewing-dropdown').animate({ 'height': '60px' });
    $('#options-selectviewing-dropdown-ul').css({ 'display': 'block' });
  } else {
    $('#options-selectviewing-dropdown').stop();
    $('#options-selectviewing-dropdown').animate({ 'height': '20px' });
    $('#options-selectviewing-dropdown-ul').css({ 'display': 'none' });
  }
}

var activeViewElemID = 'single-spec-view';
function swapViewPress(elemID) {
  if (elemID != activeViewElemID) {
    // View Changed!
    let selected = document.getElementById(elemID);
    let selectTextHead = document.getElementById('viewselecttext');
    let selText = selected.getAttribute('datavalue');
    selectTextHead.innerText = selText;

    if (selText == 'Single Species') {
      selected.innerText = '✔ Single Species';
      document.getElementById('group-spec-view').innerText = 'Common Grouping';
    } else {
      selected.innerText = '✔ Common Grouping';
      document.getElementById('single-spec-view').innerText = 'Single Species';
    }
  }
  activeViewElemID = elemID;
  swapInitControls();
}

function swapInitControls() {
  clearSearch();
  let controlDiv = document.getElementById('search-initial');
  let specifyDiv = document.getElementById('search-compare');
  let controlTemplate = undefined;
  let specifyTemplate = undefined;
  if (activeViewElemID == 'single-spec-view') {
    controlTemplate = document.getElementById('search-initial-ss-template').content.cloneNode(true);
    specifyTemplate = document.getElementById('search-compare-ss-template').content.cloneNode(true);
  } else {
    controlTemplate = document.getElementById('search-initial-gv-template').content.cloneNode(true);
    specifyTemplate = document.getElementById('search-compare-gv-template').content.cloneNode(true);
  }

  if (controlTemplate && specifyTemplate) {
    controlDiv.innerHTML = '';
    controlDiv.appendChild(controlTemplate);
    specifyDiv.innerHTML = '';
    specifyDiv.appendChild(specifyTemplate);
  }
  populateResults();
}

var whichName = 'common';
function toggleName() {
  if (whichName === 'common') {
    recordAction('switched to latin names');
    $('#search-initial-switch-button').children().stop();
    $('#search-initial-switch-button').children().animate({ left: '0px' });
    whichName = 'latin';
  } else {
    recordAction('switched to common names');
    $('#search-initial-switch-button').children().stop();
    $('#search-initial-switch-button').children().animate({ left: '75px' });
    whichName = 'common';
  }

  populateResults();

  var el = document.getElementById('legend-blue-contents-name'),
    tmp = el.innerHTML;
  el.innerHTML = el.title;
  el.title = tmp;

  var el = document.getElementById('legend-pink-contents-name'),
    tmp = el.innerHTML;
  el.innerHTML = el.title;
  el.title = tmp;

  var el = document.getElementById('legend-orange-contents-name'),
    tmp = el.innerHTML;
  el.innerHTML = el.title;
  el.title = tmp;

  tmp = $('.dropdown-input', '#search-initial-dropdown').val();
  $('.dropdown-input', '#search-initial-dropdown').val($('#search-initial-altname').html());
  $('#search-initial-altname').html(tmp);

  var swapNeeded = $('#search-initial-dropdown').css('backgroundColor') === 'rgb(202, 24, 146)';
  if (swapNeeded) {
    populateDistributionLists();
    fuseSearch(1, $('#search-compare-one-box-input').val());
    fuseSearch(2, $('#search-compare-two-box-input').val());
  }

  swapNeeded = $('#compare-dist-one-name').css('backgroundColor') === 'rgb(242, 142, 67)';
  if (swapNeeded) {
    var el = document.getElementById('compare-dist-one-name'),
      tmp = el.innerHTML;

    el.innerHTML = el.title;
    el.title = tmp;
  }

  swapNeeded = $('#compare-dist-two-name').css('backgroundColor') === 'rgb(29, 144, 156)';
  if (swapNeeded) {
    var el = document.getElementById('compare-dist-two-name'),
      tmp = el.innerHTML;

    el.innerHTML = el.title;
    el.title = tmp;
  }
}

function recordAction(event, label) {
  console.log('sending:', event, '-', label);
  ga('send', 'event', 'Interaction', event, label);
}
