import MmenuLight from 'mmenu-light';

export default () => {
  // Build the MMenu Light Plugin
  var MMenuAPI = new MmenuLight(
    document.querySelector('#main-menu'),
    '(max-width: 1199px)'
  );
  var navigator = MMenuAPI.navigation({
    selected: 'cur'
  });
  var drawer = MMenuAPI.offcanvas({
    position: "right"
  });

  // Add Click Handle to Nav bar Toggler
  document.querySelector("#menu-toggle").addEventListener('click', function (event) {
    event.preventDefault();
    // Open MMenu
    drawer.open();
  });
};