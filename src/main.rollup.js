import $ from 'jquery';
import 'bootstrap';
import 'slick-carousel';
import './lib/remove-default-styles';

import app from './app';

// jQuery .ready() function is safer to use here, as stated in documentation:
//    If the DOM becomes ready and the browser fires DOMContentLoaded before 
//    the code calls .ready( handler ), the function handler will still be executed. 
//    In contrast, a DOMContentLoaded event listener added after the event fires is NEVER executed.
// As this File is being defered when loaded, the DOMContentLoaded event may have already fired...
$(document).ready(function() {
  // Run the App
  app();
});