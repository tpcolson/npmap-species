
/**
 * Export non default application settings.
 */
function exportSettings() {
  var settings = {};

  if (!$tooltips._active)
    settings.tooltips = false;

  if (minimized)
    settings.minimized = true;

  if (lastBaseIndex !== 0)
    settings.mapBackground = lastBaseIndex;

  if (!showPredicted)
    settings.showPredicted = false;

  if (showObserved)
    settings.showObserved = true;

  if (whichName !== 'common')
    settings.whichName = whichName;

  if (!blendingActive)
    settings.blendingActive = false;

  // list of selected species {string: species, bool: displayed}
  // also used with the species density list
  if (control._selectedSpecies.length)
    settings.selectedSpecies = control._selectedSpecies.filter(function (species) {
      return species;
    }).map(function (species) {
      return {
        // TODO Do this sola IDs
        _id: species._id,
        _common: species._common,
        _latin: species._latin,
        visible: species.visible
      };
    });

  // Find names of visible layers
  var mapOverlays = NPMap.config.overlays.filter(function(item, index) {
    return item.visible;
  }).map(function(item) { return item.name; });

  // Park Boundary does not appear in the overlays dropdown list, so I assume
  // that it is not toggle-able.
  if (JSON.stringify(mapOverlays) !== '["Park Boundary"]')
    settings.mapOverlays = mapOverlays.filter(function (option) {
      return option !== 'Park Boundary';
    });

  // ???: comparison type
  if (lexFocussed && !distFocussed)
    settings.lexFocussed = true;

  if (!lexFocussed && distFocussed)
    settings.distFocussed = true;

  settings.bounds = NPMap.config.L.getBounds();

  return settings;

}

function loadSettings() {
  var settings = {};

  var anchor = location.hash.slice(1);
  if (anchor.length)
    settings = JSON.parse(decodeURI(anchor));

  // The order that these occur is very important. This application is
  // quite brittle. Same reason that I'm using jquery to click on elements.

  if (settings.tooltips === false && $tooltips._active)
    toggleTooltips();

  if (settings.mapBackground)
    updateBaseLayer(settings.mapBackground);

  if (settings.mapOverlays)
    NPMap.config.overlays.forEach(function (overlay, index) {
      if (settings.mapOverlays.includes(overlay.name))
        toggleOverlay(index);
    });

  if (settings.lexFocussed && !settings.distFocussed)
    lexFocus();

  if (settings.distFocussed && !settings.lexFocussed)
    distFocus();

  var enablers = [selectInitialSpecies, selectSecondSpecies, selectThirdSpecies];
  if (settings.selectedSpecies)
    settings.selectedSpecies.forEach(function (species, index) {
      enablers[index](species);
    });

  if (settings.showPredicted === false)
    $('#options-predicted-checkbox').trigger('click');

  if (settings.showObserved)
    $('#options-observed-checkbox').trigger('click');

  if (settings.whichName && settings.whichName !== 'common')
    toggleName();

  if (settings.blendingActive === false)
    toggleBlending();

  if (settings.bounds)
    NPMap.config.L.fitBounds([settings.bounds._southWest, settings.bounds._northEast]);

  if (settings.minimized)
    $('search-banner-help-minimizer-button').trigger('click');
}


function showShareModal() {
  var settings = exportSettings();

  // Update window's anchor/hash
  var hash = "#" + encodeURI(JSON.stringify(settings));
  // Open share modal
  $('#share-modal .share-link').val(location.href.split("#")[0] + hash);
  showModal('#share-modal');
}

speciesShareControl = null;
attemptExecute(function(){
    console.log(typeof L);
    if (typeof L == 'undefined')
        return false;
    console.log("Passed through");
    speciesShareControl = L.Control.extend({
      options: {
        ui: true,
        url: 'https://www.nps.gov/maps/print/'
      },
      initialize: function (options) {
        L.Util.setOptions(this, options);

        if (this.options.ui === true) {
          this._li = L.DomUtil.create('li', '');
          this._button = L.DomUtil.create('button', 'print', this._li);
          this._button.setAttribute('alt', 'Print the map');
          L.DomEvent.addListener(this._button, 'click', this.print, this);
        }

        return this;
      },
      addTo: function (map) {
        if (this.options.ui === true) {
          var toolbar = util.getChildElementsByClassName(map.getContainer().parentNode.parentNode, 'npmap-toolbar')[0];
          toolbar.childNodes[1].appendChild(this._li);
          toolbar.style.display = 'block';
          this._container = toolbar.parentNode.parentNode;
          util.getChildElementsByClassName(this._container.parentNode, 'npmap-map-wrapper')[0].style.top = '28px';
        }

        this._map = map;
        return this;
      },
      _clean: function (layer) {
        delete layer.L;

        // TODO: Move layer type-specific code.
        switch (layer.type) {
          case 'arcgisserver':
            delete layer.service;
            break;
        }

        if (layer.popup) {
          delete layer.popup.actions;

          if (typeof layer.popup.description === 'string') {
            layer.popup.description = util.escapeHtml(layer.popup.description);
          }

          if (typeof layer.popup.title === 'string') {
            layer.popup.title = util.escapeHtml(layer.popup.title);
          }
        }

        if (layer.tooltip) {
          layer.tooltip = util.escapeHtml(layer.tooltip);
        }
      },
      _guid: (function () {
        function s4 () {
          return Math.floor((1 + Math.random()) * 0x10000)
           .toString(16)
           .substring(1);
        }

        return function () {
          return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
        };
      })(),
      speciesShare: function (e) {
        var map = this._map;
        var me = this;
        var center = map.getCenter();
        var url = me.options.url + (me.options.url.indexOf('?') === -1 ? '?' : '&') + 'lat=' + center.lat.toFixed(4) + '&lng=' + center.lng.toFixed(4) + '&zoom=' + map.getZoom();
        var win;

        L.DomEvent.preventDefault(e);

        if (map.options.mapId) {
          url += '&mapId=' + map.options.mapId;
        } else {
          var options = map.options;
          var config = {
            baseLayers: [],
            center: options.center,
            overlays: [],
            zoom: options.zoom
          };
          var params = {
            action: 'save',
            key: this._guid()
          };
          var supportsCors = (window.location.protocol.indexOf('https:') === 0 ? true : (util.supportsCors() === 'yes'));
          var active;
          var i;
          var layer;

          for (i = 0; i < options.baseLayers.length; i++) {
            layer = options.baseLayers[i];

            if (typeof layer.L === 'object') {
              active = L.extend({}, layer);
              me._clean(active);
              config.baseLayers.push(active);
              break;
            }
          }

          for (i = 0; i < options.overlays.length; i++) {
            layer = options.overlays[i];

            if (typeof layer.L === 'object') {
              active = L.extend({}, layer);
              me._clean(active);
              config.overlays.push(active);
            }
          }

          params.value = window.btoa(JSON.stringify(config));
          url += '&printId=' + params.key;
          L.npmap.util._.reqwest({
            crossOrigin: supportsCors,
            type: 'json' + (supportsCors ? '' : 'p'),
            url: 'https://server-utils.herokuapp.com/session/' + L.Util.getParamString(params)
          });
        }

        win = window.open(url, '_blank');

        // Needed because this throws an error in Internet Explorer 8.
        try {
          win.focus();
        } catch (e) {}
      }
    });

    L.Map.addInitHook(function () {
      if (this.options.printControl) {
        var options = {};

        if (typeof this.options.printControl === 'object') {
          options = this.options.printControl;
        }

        this.printControl = L.npmap.control.print(options).addTo(this);
      }
    });

    module.exports = function (options) {
      return new PrintControl(options);
    };
});

var shareButton = document.getElementById('search-banner-help-share-button');
(new Clipboard(shareButton, {
  text: function(trigger) {
    var settings = exportSettings();

    // Update window's anchor/hash
    var hash = "#" + encodeURI(JSON.stringify(settings));
    return location.href.split("#")[0] + hash;
  }
})).on('success', function () {
  // Show success tooltip or icon change. These icons have 300ms transitions

  $('.messages').text('Share link copied to clipboard');
  $('.messages').toggleClass('hide show');

  // Hide share icon
  $('.fa-share-alt', shareButton).toggleClass('hide show');

  // Show success icon
  window.setTimeout(function () {
    $('.fa-share-alt', shareButton).hide();
    $('.fa-check-circle', shareButton).show().toggleClass('hide show');
  }, 310);

  // After 1s, hide success icon
  window.setTimeout(function () {
    $('.fa-check-circle', shareButton).toggleClass('hide show');
  }, 310 + 1000);

  // Show share icon
  window.setTimeout(function () {
    $('.fa-check-circle', shareButton).hide();
    $('.fa-share-alt', shareButton).show().toggleClass('hide show');
    $('.messages').toggleClass('hide show');
    //$('.messages').text('');
  }, 310 + 1000 + 310);

});

function showModal(id) {
  $('#modals').show();
  $(id).show();
}

function hideAllModals() {
  $('.modal').hide();
  $('#modals').hide();
}


