$(document).ready(function() {
  document.getElementById('options-predicted-checkbox').checked = true;
  document.getElementById('options-observed-checkbox').checked = false;
});

window.onload = function() {
  /* Move zoom and measure controls directly below search tool */
  attemptExecute(function() {
    var el = document.getElementsByClassName('leaflet-top leaflet-left')[0];
    var searchBar = document.getElementById('search-tool');

    if(el === undefined || searchBar === undefined) {
      return false;
    } else {
      el.style.top = window.getComputedStyle(searchBar).getPropertyValue('height');
      return true;
    }
  });

  /* Remove default base layer switcher */
  attemptExecute(function() {
    if(document.getElementsByClassName('npmap-control-switcher')[0] === undefined) {
      return false;
    }

    $(document.getElementsByClassName('npmap-control-switcher')[0]).remove();
    return true;
  });

  /* turn off overlays by default */
  attemptExecute(function() {
    if(NPMap === undefined || NPMap.config === undefined || NPMap.config.overlays === undefined || NPMap.config.L === undefined) {
      return false;
    }

    for(var i = 0; i < NPMap.config.overlays.length; i++) {
      var overlay = NPMap.config.overlays[i];

      if(overlay.name === 'Trails' || overlay.name === 'Visitor Centers' || overlay.name === 'Roads' || overlay.name === 'Shelters' || overlay.name === 'Campsites') {
        overlay.visible = false;
        NPMap.config.L.removeLayer(overlay.L);
      }
    }

    return true;
  });

  /* move annotation tools to tophat */
  attemptExecute(function() {
    if(document.getElementsByClassName('leaflet-control-edit')[0] === undefined) {
      return false;
    }

    var editControls = document.getElementsByClassName('leaflet-control-edit')[0];
    editControls.style.boxShadow = '0px';
    editControls.style.width = '84px';
    editControls.style.height = '26px';
    editControls.style.webkitBoxShadow = 'none';
    editControls.style.mozBoxShadow = 'none';
    editControls.style.msBoxShadow = 'none';
    editControls.style.oBoxShadow = 'none';
    editControls.style.boxShadow = 'none';
    $(editControls.children[2]).remove();
    $(editControls.children[2]).remove();
    editControls.children[0].style.borderTop = '0px';
    editControls.children[0].style.borderRadius = '4px 0px 0px 4px';
    editControls.children[2].style.borderRadius = '0px 4px 4px 0px';
    for(var i = 0; i < editControls.children.length; i++) {
      editControls.children[i].style.boxSizing = 'border-box';
      editControls.children[i].style.height = '28px';
      editControls.children[i].style.width = '28px';
      editControls.children[i].style.float = 'left';
    }
    document.getElementById('options-annotations-buttons').appendChild(editControls);

    var me = NPMap.config.L.editControl;
    L.DomEvent
      .disableClickPropagation(editControls.children[0])
      .on(editControls.children[0], 'click', function () {
        recordAction('drew marker');
      }, me._modes['marker'].handler);
    L.DomEvent
      .disableClickPropagation(editControls.children[0])
      .on(editControls.children[1], 'click', function () {
        recordAction('drew polyline');
      }, me._modes['marker'].handler);
    L.DomEvent
      .disableClickPropagation(editControls.children[0])
      .on(editControls.children[2], 'click', function () {
        recordAction('drew circle');
      }, me._modes['marker'].handler);

    return true;
  });

  /* prepare print tool */
  attemptExecute(function() {
    if (!(NPMap && NPMap.config && NPMap.config.L && NPMap.config.L.printControl && NPMap.config.L.printControl.print)) {
      return false;
    }

    var printContainer = L.DomUtil.create('div', 'leaflet-bar leaflet-control npmap-control-print'),
      bg = $('.npmap-toolbar .right li button').css('background-image');

    $('.leaflet-top.leaflet-left').append($(printContainer));
    $(printContainer).append($('.npmap-toolbar .right li button'));
    $('.npmap-map-wrapper').css({'top': '0px'});
    $('.npmap-control-print button').css({
      'background-image': bg,
      'background-repeat': 'no-repeat',
      'background-position': 'center',
      'border-top': '1px solid #1a2423',
      'height': '26px'
    });

    return true;
  });

  /* prepare search tool */
  prepareSearchTool();

  /* prepare color legend dragging */
  prepareLegendDrag();

  /* prepare tooltips */
  $tooltips._initialize(document.body);

  /* prepare server connection */
  if(Cookies.get('name') === undefined) {
    function s4() {
      return Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1);
    }
    var val = s4() + s4() + '-' + s4() + '-' + s4() + '-' +
      s4() + '-' + s4() + s4() + s4();
    Cookies.set('name', val, {path:''});
  }
  connectToLoggingServer();
}

function attemptExecute(fn) {
  if(!fn()) {
    setTimeout(fn, 50);
  }
}

var tooltipsEnabled = true;
function toggleTooltips() {
  $tooltips._toggleTooltips();

  var tooltipsButton = document.getElementById('search-banner-help-tooltips').children[0].children[0];
  if(tooltipsEnabled) {
    recordAction('tooltips turned off');
    tooltipsButton.innerHTML = 'TOOLTIPS OFF';
    tooltipsButton.style.color = '#a5aaa2';
  } else {
    recordAction('tooltips turned on');
    tooltipsButton.innerHTML = 'TOOLTIPS ON';
    tooltipsButton.style.color = '#f5faf2';
  }

  tooltipsEnabled = !tooltipsEnabled;
}

function showHelp() {
  recordAction('showed help overlay');
  if(minimized) {
    toggleMinimized();

    setTimeout(function() {
      $('body').chardinJs('start');
    }, 200);
  } else {
    $('body').chardinJs('start');
  }
}

var minimized = false,
  currentBaseLayer = undefined;
function toggleMinimized() {
  var minButton = document.getElementById('search-banner-help-minimizer').children[0].children[0];
  if(!minimized) {
    recordAction('minimized toolbar');
    $('body').chardinJs('stop');
    minButton.innerHTML = '+';
    $('#search-tool').css({overflow: 'hidden'});
    $('#search-tool').stop();
    $('.leaflet-top.leaflet-left').stop();
    $('#search-tool').animate({height:'40px'});
    $('.leaflet-top.leaflet-left').animate({top: '40px'});
  } else {
    recordAction('expanded toolbar');
    minButton.innerHTML = '\u2014';
    $('#search-tool').stop();
    $('.leaflet-top.leaflet-left').stop();
    $('#search-tool').animate({height:'189px'}, function() {
      $('#search-tool').css({overflow: 'visible'});
    });
    $('.leaflet-top.leaflet-left').animate({top: '189px'});
  }

  minimized = !minimized;
}

var lastBaseIndex = 0;
function updateBaseLayer() {
  var selector = document.getElementById('options-background-dropdown');
  if(selector.selectedIndex > 0) {
    /* remove last layer (taken from NPMap.js switcher.js) */
    selector.children[lastBaseIndex+1].innerHTML = selector.children[lastBaseIndex+1].innerHTML.substring(2, selector.children[lastBaseIndex+1].innerHTML.length);
    NPMap.config.baseLayers[lastBaseIndex].visible = false;
    NPMap.config.L.removeLayer(NPMap.config.baseLayers[lastBaseIndex].L);

    /* add new layer (taken from NPMap.js switcher.js) */
    recordAction('changed base layer: ' + selector.children[selector.selectedIndex].innerHTML);
    selector.children[selector.selectedIndex].innerHTML = '\u2714 ' + selector.children[selector.selectedIndex].innerHTML;
    var newLayer = NPMap.config.baseLayers[selector.selectedIndex-1];
    if (newLayer.type === 'arcgisserver') {
      newLayer.L = L.npmap.layer[newLayer.type][newLayer.tiled === true ? 'tiled' : 'dynamic'](newLayer);
    } else {
      newLayer.L = L.npmap.layer[newLayer.type](newLayer);
    }
    newLayer.visible = true;
    currentBaseLayer = newLayer.L;
    NPMap.config.L.addLayer(newLayer.L);

    lastBaseIndex = selector.selectedIndex-1;
  }
  selector.selectedIndex = 0;
}

function prepareOverlay() {
  var selector = document.getElementById('options-overlays-dropdown');
  selector.selectedIndex = 0;
}

function toggleOverlay() {
  var selector = document.getElementById('options-overlays-dropdown'),
    idx = selector.selectedIndex - 1,
    text = selector.options[idx+1].text;
  if(idx >= 0) {
    var overlay = NPMap.config.overlays[idx];
    if(text.charAt(0) !== '\u2714') {
      recordAction('turned on overlay: ' + text);
      selector.options[idx+1].text = '\u2714 ' + text;
      overlay.visible = true;
      NPMap.config.L.addLayer(overlay.L);
    } else {
      recordAction('turned off overlay: ' + text.substring(2, text.length));
      selector.options[idx+1].text = text.substring(2, text.length);
      overlay.visible = false;
      NPMap.config.L.removeLayer(overlay.L);
    }
  }
  selector.selectedIndex = 0;
}

var showPredicted = true;
function togglePredicted() {
  showPredicted = !showPredicted;

  if(showPredicted) {
    recordAction('turned on predicted data');
    drawData();
  } else {
    recordAction('turned off predicted data');
    for(var i = 0; i < control._selectedSpecies.length; i++) {
      if(control._selectedSpecies[i] !== undefined && control._selectedSpecies[i].visible) {
        NPMap.config.L.removeLayer(control._selectedSpecies[i].predicted);
      }
    }
  }
}

var showObserved = false;
function toggleObserved() {
  showObserved = !showObserved;

  if(showObserved) {
    recordAction('turned on observed data');
  } else {
    recordAction('turned off observed data');
  }

  for(var i = 0; i < control._selectedSpecies.length; i++) {
    if(control._selectedSpecies[i] !== undefined && control._selectedSpecies[i].visible) {
      if(showObserved) {
        control._selectedSpecies[i].observed.addTo(NPMap.config.L);
      } else if(i == 0) {
        NPMap.config.L.removeLayer(control._selectedSpecies[i].observed);
      }
    }
  }
}

var whichName = 'common';
function toggleName() {
  if(whichName === 'common') {
    recordAction('switched to latin names');
    $('#search-initial-switch-button').children().stop();
    $('#search-initial-switch-button').children().animate({left:'0px'});
    whichName = 'latin';
  } else {
    recordAction('switched to common names');
    $('#search-initial-switch-button').children().stop();
    $('#search-initial-switch-button').children().animate({left:'75px'});
    whichName = 'common';
  }

  var el = document.getElementById('search-compare-one-box-name'),
    tmp = el.innerHTML;
  el.innerHTML = el.title;
  el.title = tmp;

  var el = document.getElementById('search-compare-two-box-name'),
    tmp = el.innerHTML;
  el.innerHTML = el.title;
  el.title = tmp;

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

  var swapNeeded = $('#search-initial-dropdown').css('backgroundColor') === 'rgb(64, 181, 198)';
  if(swapNeeded) {
    var el = $('#search-initial-dropdown').children()[0],
      tmp = el.innerHTML;

    el.innerHTML = el.title;
    el.title = tmp;
  }

  swapNeeded = $('#compare-dist-one-name').css('backgroundColor') === 'rgb(202, 24, 146)';
  if(swapNeeded) {
    var el = document.getElementById('compare-dist-one-name'),
      tmp = el.innerHTML;

    el.innerHTML = el.title;
    el.title = tmp;
  }

  swapNeeded = $('#compare-dist-two-name').css('backgroundColor') === 'rgb(242, 142, 67)';
  if(swapNeeded) {
    var el = document.getElementById('compare-dist-two-name'),
      tmp = el.innerHTML;

    el.innerHTML = el.title;
    el.title = tmp;
  }

  swapNeeded = $('#compare-env-one-name').css('backgroundColor') === 'rgb(202, 24, 146)';
  if(swapNeeded) {
    var el = document.getElementById('compare-env-one-name'),
      tmp = el.innerHTML;

    el.innerHTML = el.title;
    el.title = tmp;
  }

  swapNeeded = $('#compare-env-two-name').css('backgroundColor') === 'rgb(242, 142, 67)';
  if(swapNeeded) {
    var el = document.getElementById('compare-env-two-name'),
      tmp = el.innerHTML;

    el.innerHTML = el.title;
    el.title = tmp;
  }

  /* switch compare names */
  $('ul', '#search-compare-one-box').children().each(function() {
    var tmp = this.innerHTML;
    this.innerHTML = this.title;
    this.title = tmp;
  });
  $('ul', '#search-compare-two-box').children().each(function() {
    var tmp = this.innerHTML;
    this.innerHTML = this.title;
    this.title = tmp;
  });
  $('ul', '#compare-dist-one').children().each(function(i) {
    if(i > 0) {
      var tmp = this.innerHTML;
      this.innerHTML = this.title;
      this.title = tmp;
    }
  });
  $('ul', '#compare-dist-two').children().each(function(i) {
    if(i > 0) {
      var tmp = this.innerHTML;
      this.innerHTML = this.title;
      this.title = tmp;
    }
  });
  $('ul', '#compare-env-one').children().each(function(i) {
    if(i > 0) {
      var tmp = this.innerHTML;
      this.innerHTML = this.title;
      this.title = tmp;
    }
  });
  $('ul', '#compare-env-two').children().each(function(i) {
    if(i > 0) {
      var tmp = this.innerHTML;
      this.innerHTML = this.title;
      this.title = tmp;
    }
  });
}

var conn,
  connReady = false,
  epoch = new Date().getTime();
function connectToLoggingServer() {
  if('WebSocket' in window) {
    conn = new WebSocket('ws://seelab.eecs.utk.edu:7777/ws');
    conn.onopen = function() {
      connReady = true;
    }
    conn.onclose = function() {
      connReady = false;
    }
    conn.onerror = function() {
      connReady = false;
    }
  }
}

function recordAction(str) {
  if(connReady) {
    var userID = Cookies.get('name');
    conn.send(userID + ',' + new Date().getTime() + ',' + (new Date().getTime() - epoch) + ',' + str);
  }
}
