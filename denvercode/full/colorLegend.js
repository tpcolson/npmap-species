var blendingActive = true;
function toggleBlending() {
  blendingActive = !blendingActive;

  $('div', '#legend-blend-switch-button').stop();
  if(blendingActive) {
    $('div', '#legend-blend-switch-button').animate({left: '25px'});
  } else {
    $('div', '#legend-blend-switch-button').animate({left: '0px'});
  }
}
