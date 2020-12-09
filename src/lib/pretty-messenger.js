/*******************************************************************************
 * PrettyMessenger.js
 *
 * Takes the standard CMS messages and presents them in a nice modern
 * way. Snazzy anims and Fade ins
 *
 * Author: Owen Evans | 11/06/2020
 ******************************************************************************/
export default class PrettyMessenger {
  constructor() {
    this.aMessages = [];

    // Set default trickle time
    this.nTrickleTime = 1000;
    // Default time when the message is clicked the time in ms before it's removed
    this.nRemoveTime = 500;
    this.sOnclick = "console.log(\"\")";

    this.sContainerClass = 'pretty-messenger-container fixed-bottom';

    // Error Mapping to Class Names
    this.oAlertTypes = {
      'error': 'alert-danger',
      'info': 'alert-warning',
      'basket': 'alert-success',
      'warn': 'alert-warning'
    };
    this.sAlertMarkup = '<div class="alert $TYPE$ alert-dismissible fade show animated fadeInRight fast" role="alert">$CONTENT$<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">×</span></button></div>';
  }

  /*******************************************************************************
   * findMessages - Finds ugly ducklings and turns them into beautiful swans.
   * Well that's the hope anyway...
   ******************************************************************************/
  findMessages(oElem) {
    // Get messages and turn into array
    if(oElem == null) oElem = document;
    
    var aMessagePriorties = oElem.querySelectorAll('.MsgPriority');
    aMessagePriorties = Array.prototype.slice.call(aMessagePriorties);

    this.aMessages = aMessagePriorties;

    // Hide the old messages and process if we have them
    if(aMessagePriorties.length){

      // Hide Messages if we can
      if(aMessagePriorties[0].parentNode != null){
        aMessagePriorties[0].parentNode.parentNode.parentNode.style.display = "none";
      }
      this.processMessage(oElem);
    }
  }

  /*******************************************************************************
   * ProcessMessage - Processes a message if it can be found within the message
   * array built in findMessages
   ******************************************************************************/
  processMessage() {

    var oMessage = this.aMessages.shift();

    if(typeof oMessage == "undefined") return;

    var oCont = document.getElementById("PrettyMessengerCont");
    if(oCont != null) {
      oCont.style.maxHeight = window.innerHeight + "px";
    }

    var sMsg = oMessage.nextElementSibling.innerHTML;
    var oRegExpMsg = /.*c2message(.*).gif/;
    var aRes = oRegExpMsg.exec(oMessage.firstChild.src);
    var sType = "";
    
    if(aRes == null){
      sType = oMessage.firstChild.alt;
    } else {
      // Get the Type
      sType = aRes[1];
    }
    
    // Change to info if got from alt text fallback
    if(sType == "information") sType = "info";

    // If ec basket action change to basket type
    if((sType == "info") && oMessage.nextElementSibling.firstChild.className == "ECBoughtItems"){
      sType = "basket";
    }
    
    var sPrettyMessenger = this.sAlertMarkup;

    // Replace the Type Macro
    sPrettyMessenger = sPrettyMessenger.replace('$TYPE$', this.oAlertTypes[sType]);

    // Replace the Content Macro
    sPrettyMessenger = sPrettyMessenger.replace('$CONTENT$', sMsg);

    // Work out if we already have a container on the page. If so fade in
    // to the container and push the message up
    var bContainer = (document.getElementById('pretty-messenger') != null) ? 1 : 0;

    // If we have no container then output to body
    if(!bContainer){
      document.body.insertAdjacentHTML('beforeend', `<div id='pretty-messenger' class='${this.sContainerClass}'>${sPrettyMessenger}</div>`);
    } else {
      document.getElementById('pretty-messenger').insertAdjacentHTML('beforeend', sPrettyMessenger);
    }

    // Process the Next Message in nTrickleTime
    setTimeout(() => {
      this.processMessage();
    }, this.nTrickleTime);

  }
}