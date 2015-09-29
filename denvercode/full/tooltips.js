var $tooltips = {
  _active: true,
  _titles: {},
  _registerTooltip: function(el, title) {
    this._titles[el.id] = title;

    if(this._active) {
      el.title = title;
    }
  },
  _toggleTooltips: function() {
    this._active = !this._active;

    if(this._active) {
      for(var id in this._titles) {
        document.getElementById(id).title = this._titles[id];
      }
    } else {
      for(var id in this._titles) {
        document.getElementById(id).title = '';
      }
    }
  },
  _initialize: function(root) {
    var queue = [root];

    while(queue.length > 0) {
      var el = queue.shift();

      if(el.getAttribute('tooltip') !== null) {
        this._registerTooltip(el, el.getAttribute('tooltip'));
      }

      for(var i = 0; i < el.children.length; i++) {
        var child = el.children[i];
        queue.push(child);
      }
    }
  }
}
