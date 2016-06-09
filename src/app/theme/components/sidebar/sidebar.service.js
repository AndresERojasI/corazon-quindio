(function() {
  'use strict';

  angular.module('ROA.theme.components')
      .service('sidebarService', sidebarService);

  /** @ngInject */
  function sidebarService($state) {
    var ignoredStates = ['login', 'noClient'];
    var staticMenuItems = [];

    this.getMenuItems = function() {
      var states = defineMenuItemStates();
      var menuItems = states.filter(function(item) {
        return item.level == 0;
      });

      menuItems.forEach(function(item) {
        var children = states.filter(function(child) {
          return child.level == 1 && child.name.indexOf(item.name) === 0;
        });
        item.subMenu = children.length ? children : null;
      });

      return menuItems.concat(staticMenuItems);
    };

    function defineMenuItemStates() {
      return $state.get()
          .filter(function(s) {
            // Avoid listing login as a menu item
            return  (s.name && ignoredStates.indexOf(s.name) >= 0)?
                      false : s.sidebarMeta;
          })
          .map(function(s) {
            var meta = s.sidebarMeta;
            return {
              name: s.name,
              title: s.title,
              level: (s.name.match(/\./g) || []).length,
              order: meta.order,
              icon: meta.icon,
              root: '#/' + s.name.replace('.', '/'),
            };
          })
          .sort(function(a, b) {
            return (a.level - b.level) * 100 + a.order - b.order;
          });
    }
  }
})();
