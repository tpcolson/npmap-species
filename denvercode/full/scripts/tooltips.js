var $tooltips = {
  _active: true,
  _titles: [],
  _registerTooltip: function (el, title) {
    this._titles.push([el, title]);

    if (this._active) {
      el.title = title;
    }
  },
  _removeTooltip: function (el) {
    for (var i = 0; i < this._titles.length; i++) {
      if (this._titles[i][0] === el) {
        delete this._titles[i];
        el.title = '';
        break;
      }
    }
  },
  _toggleTooltips: function () {
    this._active = !this._active;

    if (this._active) {
      for (var i = 0; i < this._titles.length; i++) {
        $(this._titles[i][0]).prop('title', this._titles[i][1]);
      }
    } else {
      for (var i = 0; i < this._titles.length; i++) {
        $(this._titles[i][0]).prop('title', '');
      }
    }
  },
  _initialize: function (root) {
    var queue = [root];

    while (queue.length > 0) {
      var el = queue.shift();

      if (el.getAttribute('tooltip') !== null) {
        this._registerTooltip(el, el.getAttribute('tooltip'));
      }

      for (var i = 0; i < el.children.length; i++) {
        var child = el.children[i];
        queue.push(child);
      }
    }
  },
  _destroy: function () {
    for (var i = 0; i < this._titles.length; i++) {
      this._titles[i][0].prop('title', '');
    }

    this._titles = {};
  }
}
