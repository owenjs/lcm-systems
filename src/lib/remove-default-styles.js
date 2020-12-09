// Move this to a Service Worker?
(function (d) {
  var c2StyleSheetsToRemove = [
    'tabbedPageItem',
    'ldi'
  ];
  
  for (var i = 0; i < d.styleSheets.length; i++) {
    if (!d.styleSheets[i].href) { continue }
  
    // For each StyleSheet on the page, check if it needs to be disabled
    for (var k = 0; k < c2StyleSheetsToRemove.length; k++) {
      if (d.styleSheets[i].href.indexOf(c2StyleSheetsToRemove[k]) !== -1) {
        d.styleSheets[i].disabled = true;
        // Add display attribute to the DOM Element too
        // This is so if the Sheet is reloaded at all it will remain disabled
        // This can happen through c2AutoReload being on in the admin preview
        // Or Reload CSS Extention for Chrome is triggered
        d.styleSheets[i].ownerNode.disabled = true;
      }
    }
  }

  d.querySelector('html').classList.add('c2-loaded');
})(document);