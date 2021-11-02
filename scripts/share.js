
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
  $('.fa-share-square', shareButton).toggleClass('hide show');

  // Show success icon
  window.setTimeout(function () {
    $('.fa-share-square', shareButton).hide();
    $('.fa-check-circle', shareButton).show().toggleClass('hide show');
  }, 310);

  // After 1s, hide success icon
  window.setTimeout(function () {
    $('.fa-check-circle', shareButton).toggleClass('hide show');
  }, 310 + 1000);

  // Show share icon
  window.setTimeout(function () {
    $('.fa-check-circle', shareButton).hide();
    $('.fa-share-square', shareButton).show().toggleClass('hide show');
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


