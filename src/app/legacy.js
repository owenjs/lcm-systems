import $ from 'jquery';
import objectFitImages from 'object-fit-images';

var productModelSelectorx = function () {
  // Exact copy of 'this', so 'this' can be used within function 
  // without using .bind(this)
  var _this = this;
  // Useful selectors, used throughout
  this.productFields = {
    form:       document.querySelector('.lcm-product-detail__buy__data form'),
    colNames:   document.querySelectorAll('.lcm-product-detail__buy__data table td.ResultsFieldName'),
    wrapper:    document.querySelector('.lcm-product-detail__buy'),
    price:      document.querySelector('.lcm-product-detail__buy__price'),
    selector:   document.querySelector('.lcm-product-detail__buy__select'),
    qtyInput:   document.querySelector('.lcm-product-detail__buy__qty input'),
    submitBtn:  document.querySelector('.lcm-product-detail__buy__submit input'),
    message:    document.querySelector('.lcm-product-detail__buy__message'),
    stock:      document.querySelector('.lcm-product-detail__buy__stock')
  };
  // The Data Rows in the origial Form
  this.dateRows = Array.prototype.slice.call(document.querySelectorAll('.lcm-product-detail__buy__data table tr[class*="ResultsRow"]'));
  // The Product Options, see this.init()
  this.options = new Array();

  /**
   * Creates options array and builds the nessassary components for the buy form
   * @method init
   */
  this.init = function () {
    // For Each Row build out the option array
    this.dateRows.forEach(function (dataRow) {
      _this.options.push({
        name: dataRow.querySelector('.PDOptionTableName').textContent,
        priceDom: dataRow.querySelector('.PDOTQ'),
        price: dataRow.querySelector('.PDOTQ').textContent,
        stockMsg: _this.splitStockMsg(dataRow.querySelector('.StockMessage')),
        input: dataRow.querySelector('.PDOTOQ input') || dataRow.querySelector('.PDOTV input.form'),
        variations: _this.findVariations(Array.prototype.slice.call(dataRow.querySelectorAll('.PDOTV select')))
      });
    });

    // Build Model Selector using the product options above
    if (this.options.length) {
      this.buildSelector();
      // Set Fields for the First Option
      this.setFields(0);
    }

    // Add onChange Handler for qtyInput
    if(this.productFields.qtyInput) {
      this.productFields.qtyInput.addEventListener('change', this.handleQtyChange.bind(this));
    }

    // Add onClick Handler for Submit Button
    if (this.productFields.submitBtn && !this.productFields.submitBtn.classList.contains('lcm-switch-lang')) {
      // The Form will Submit
      this.productFields.submitBtn.addEventListener('click', this.handleSubmit.bind(this));
    } else {
      // We need to switch over to the Romanian site on Submit
      this.productFields.submitBtn.addEventListener('click', function (e) {
        e.preventDefault();
        this.handleLangSwitch(this.productFields.submitBtn.dataset.lang);
      }.bind(this));
    }
  };

  /**
   * Splits the given message, if possible, and returns an Object
   * @method splitStockMsg
   * @param {String} msg The Message
   * @return {Object} Contains the message and the stock, can be null
   */
  this.splitStockMsg = function (msg) {
    var message = null, stock = null;
    if (msg) {
      msg = msg.innerHTML;
      var splitArray = msg.split(' | ');
      if (splitArray.length > 1) {
        // Successful split
        stock = splitArray[0];
        message = splitArray[1];
      } else {
        message = splitArray[0];
      }
    }
    return { msg: message, stock: stock };
  };

  /**
   * Returns an array of Variations with it's correct label and cloned select box
   * @method findVariations
   * @param {Array} variationsSelects The Dom Selects for the Variations
   * @return {Array} Array of Objects, each object contains:
   *             {
   *                 label: Correct label for this variation, with : at the end
   *                 select: cloned select box for this variation
   *             }
   */
  this.findVariations = function (variationsSelects) {
    if (!variationsSelects.length) { return }

    var variations = new Array();
    variationsSelects.forEach(function (select, id) {
      // Find the index Position of this select
      // So we can match it with the correct label
      var index = $(select).closest('tr').children().index($(select).closest('td'));
      variations.push({
        label: _this.productFields.colNames[index] ? _this.productFields.colNames[index].textContent + ':' : null,
        originalSelect: select,
        select: _this.cloneVariationSelect(select, id)
      });
    });
    return variations;
  };

  /**
   * Returns the cloned select box with the correct event handlers attached
   * @method cloneVariationSelect
   * @param {HTMLSelectElement} selectToClone The Select to Clone
   * @param {Int} id The id the variation the select box belongs too
   * @return {HTMLSelectElement} The cloned select
   */
  this.cloneVariationSelect = function (selectToClone, id) {
    var clonedSelect = selectToClone.cloneNode(true); // Deep
    clonedSelect.id += 'cloned';

    clonedSelect.addEventListener('change', function (e) {
      _this.handleVariationChange(e.target, selectToClone, id);
    });

    return clonedSelect;
  };

  /**
   * Changes the Value of the Original Select,
   * allows \c2\srcresources\form_variationpricechange.js to calculate 
   * the new price, then updates the price and replaces the current 
   * variation select box with a new cloned select box
   * @method handleVariationChange
   * @param {HTMLSelectElement} select The select box of the Variation 
   *  being changed
   * @param {HTMLSelectElement} originalSelect The select box the 
   *  previous parameter is representing
   * @param {Int} id The id of the variation being changed
   */
  this.handleVariationChange = function (select, originalSelect, id) {
    originalSelect.value = select.value;
    // Must also fire the Change event on the Original Select,
    // Programmatically changing .value doesn't do this.
    // Copied from http://youmightnotneedjquery.com/
    var event = document.createEvent('HTMLEvents');
    event.initEvent('change', true, false);
    originalSelect.dispatchEvent(event);

    // Wait 0.1s till the Event has finished
    setTimeout(function () {
      // Update Price, this could have changed
      var newPrice = _this.options[_this.selectedOption].price = _this.options[_this.selectedOption].priceDom.textContent;
      _this.updatePrice(newPrice);

      // Re-clone the Original Select Box and Replace current select box
      var reClone = _this.cloneVariationSelect(originalSelect, id),
        currentSelect = _this.options[_this.selectedOption].variations[id].select;

      var oldSelect = document.querySelector('#' + currentSelect.id);
      if(Element.prototype.replaceWith) {
        oldSelect.replaceWith(reClone);
      } else {
        // IE Support
        $(oldSelect).replaceWith($(reClone));
      }
      _this.options[_this.selectedOption].variations[id].select = reClone;
      _this.options[_this.selectedOption].variations[id].select.value = originalSelect.value;
      _this.options[_this.selectedOption].variations[id].select.focus();
    }, 100);
  };

  /**
   * Clones the current Model Select Box wrapper and replaces the
   * label and select box with the variations' label and select box.
   * The inserts the clone before the Quantity Box
   * @method buildVariations
   * @param {Array} variations The variations to build
   */
  this.buildVariations = function (variations) {
    variations.forEach(function (variation) {
      // Clone the regular select box for the Model
      // Allowing the Markup to be changed and this funtion to still work
      var selectBoxNode = this.productFields.selector.cloneNode(true); // Deep
      selectBoxNode.classList.add('cloned');

      // Replace the Label and Select
      selectBoxNode.querySelector('label').textContent = variation.label;
      selectBoxNode.replaceChild(variation.select, selectBoxNode.querySelector('select'));

      this.productFields.wrapper.insertBefore(selectBoxNode, this.productFields.qtyInput.parentNode);
    }.bind(this));
  };

  /**
   * Builds the Model Selector, adds the correct change listener
   * and appends it to the select wrapper
   * @method buildSelector
   */
  this.buildSelector = function () {
    var selector = document.createElement('select'),
      optionsString = "";

    this.options.forEach(function (option, i) {
      optionsString += '<option value="' + i + '">' + option.name + '</option>';
    });

    selector.innerHTML = optionsString;

    // Add On Change Handler
    selector.addEventListener('change', function (e) {
      // Change Previous Option input back to 0
      _this.options[_this.selectedOption].input.value = '0';
      _this.setFields(Number(e.target.value));
    });

    // Add Selector to the product select container and 'this'
    this.productFields.selector.appendChild(selector);
    this.modelSelector = selector;
  };

  /**
   * Sets the Fields in the Visable Form on the Page, which are:
   *    Price - Updates
   *    Model - Doesn't update - Already changed
   *    Variations - Builds Variations if there's any
   *    Quantity Box - Reset back to 0
   *    Submit Button - Doesn't Update
   *    Message - May be null
   *    Stock - May be null
   * @method setFields
   * @param {Int} value The new Value of the Model Selected
   */
  this.setFields = function (value) {
    this.selectedOption = value;
    var option = this.options[this.selectedOption];

    this.updatePrice(option.price)
    // Change Input back to 0
    this.productFields.qtyInput.value = '0';
    // Update Stock
    if (option.stockMsg.stock) {
      //this.productFields.qtyInput.setAttribute('max', parseInt(option.stockMsg.stock, 10));
      this.productFields.stock.innerHTML = '<b>' + option.stockMsg.stock + '</b>';
    } else {
      this.productFields.stock.innerHTML = "";
    }
    // Update Message
    if (option.stockMsg.msg) {
      this.productFields.message.innerHTML = '<span>' + option.stockMsg.msg + '</span>';
    } else {
      this.productFields.message.innerHTML = "";
    }
    // Remove any Variations
    var variations = Array.prototype.slice.call(this.productFields.wrapper.querySelectorAll('.lcm-product-detail__buy__select.cloned'));
    variations.forEach(function (variation) {
      variation.remove();
    });
    // Build new Variations if necessary
    if (option.variations) {
      this.buildVariations(option.variations);
    }
  };

  /**
   * Updates the Price in the visible form
   * @method updatePrice
   */
  this.updatePrice = function (newPrice) {
    this.productFields.price.innerHTML = '<span>' + newPrice + '</span>';
  };

  /**
   * Updates the Value of the quantity box in the origial form
   * @method handleQtyChange
   */
  this.handleQtyChange = function (e) {
    if (this.options[this.selectedOption].input) {
      this.options[this.selectedOption].input.value = e.target.value;
    } else if (document.querySelector('.BuyFormFieldQty input')) {
      document.querySelector('.BuyFormFieldQty input').value = e.target.value;
    }
  };

  /**
   * Submits the Form
   * @method handleSubmit
   */
  this.handleSubmit = function (e) {
    this.productFields.form.submit();
  };

  /**
   * Switches to a given Language
   * @method handleLangSwitch
   * @param {String} langCode The Language code to swtich to
   */
  this.handleLangSwitch = function (langCode) {
    var option = document.querySelector('#language-selector option[data-lang*="' + langCode + '"]');
    // Grab the Lang Switch URL
    if(option)
      window.location = option.value;
  };

  // Call init
  this.init();
};

var productDetails = {

  available: function () {
    productDetails.container = $('.lcm-product-detail');
    if (productDetails.container.length > 0) {
      // Return true if we are on the product page
      return true;
    }
    return false;
  },

  buyable: function () {
    if ($('.lcm-product-detail.c2pdbuy').length > 0) {
      // Return true if this product is buyable
      return true;
    }
    return false;
  },

  initialise: function () {
    if (!productDetails.available()) { return }

    // Move the original Container into the correct place
    productDetails.moveContainer();

    // Move Request a quote form into the current place
    productDetails.moveRequestForm()

    // Build Tab
    productDetails.buildTabs();

    // Check if this Product Details page is a Buyable Product
    if (!productDetails.buyable()) {
      // Remove "Add to Basket" Button, as this product is not buyable
      if (document.querySelector('.lcm-product-detail__buy')) {
        document.querySelector('.lcm-product-detail__buy').classList.add('d-none');
      }
      // Return Early
      return;
    }

    // Remove no longer need Elements
    $('.lcm-product-detail .request-a-quote').remove();
    $('.lcm-product-detail .quote').remove();
    $('.c2-hero__inner__buy').removeClass('d-none');

    // Product is buyable, build product model Selector
    new productModelSelectorx();

    // TDB: If there are no models to choose from

  },

  moveContainer: function () {
    if ($('.slider .lcm-product-detail').length > 0) {
      $('.location + .container').append(productDetails.container);
    }
    productDetails.container.removeClass('d-none');
  },

  moveRequestForm: function () {
    var productDetailForm = $('.product-detail-form');

    if (productDetailForm.length > 0) {
      productDetailForm.addClass('visible');
      productDetails.container.find('.request-a-quote').append(productDetailForm);
    }
  },

  buildTabs: function () {
    // Build Tab Headings
    $('.lcm-product-detail__tabs__tab').each(function (index) {
      var thisTab = $(this);
      var title = thisTab.data('title');
      var addClass = "";
      if (index == 0) {
        $(this).addClass('active');
        addClass = " active";
      }
      if (title == "Request A Quote" || thisTab.data('tabclass') == "Quote") {
        addClass = addClass + " quote";
      }
      $('.lcm-product-detail__tabs__headings').append('<div class="lcm-product-detail__tabs__headings__heading' + addClass + '"><a href="#">' + thisTab.data('title') + '</a></div>')
    });

    // Add Click Handles for the Tab Headings
    $('.lcm-product-detail__tabs__headings__heading').click(function (e) {
      e.preventDefault();
      // Scroll Tabs into View is not already done...
      $([document.documentElement, document.body]).animate({
        scrollTop: $('.lcm-product-detail__tabs__headings').offset().top - 20
      }, 500);
      var currentHeading = $(this);
      var index = currentHeading.index() + 1;
      if (!currentHeading.hasClass('active')) {
        $('.lcm-product-detail__tabs__headings__heading').removeClass('active');
        $('.lcm-product-detail__tabs__tab').removeClass('active');
        $('.lcm-product-detail__tabs__headings__heading:nth-child(' + index + ')').addClass('active');
        $('.lcm-product-detail__tabs__tab:nth-child(' + index + ')').addClass('active');
      }
    });
  }

};

var app = {

  initialise: function () {

    setTimeout(function () {
      // If the Script hasn't finshed loading in 2s
      // Remove the loading spinner and hope for the best...
      // As set time out starts a new thread even if the Javascript errors
      // The loading spinner is still removed
      $('.loading').removeClass('visible');
    }, 2000);
	  
	  objectFitImages();

    // Fix Image CTAs on "Markets Served" Page
    app.marketServedFix();

    app.addSelectRule();

    // Add Click Handler for Currency Selector
    app.initCurrencySelector();

    // If there are messages on the page, prettify them
    app.prettyMessenger();

    // Add Click Handlers to open and close the search Box
    app.initSearchBox();

    // Initialise MMenu Plugin
    //app.initMMenu();

    // Remove any Empty Related Content Items from Slider, if any
    app.removeEmptyRelatedContentItems();

    // Initialise all available Slick Sliders
    app.initSlick();

    // Move Page Banners into the correct Positions
    app.moveBanners();

    // Set up Product Pages, if available
    productDetails.initialise();

    // Show Parent on Dropdown Menus
    app.showParentDropDownMenus();

    // Hide Form Field before previous
    app.hideFormFieldBeforePrevious();

    // Set up Accordion for Field Sets
    app.accordionFieldSets();

    // Remove Loading Spinner on Completion
    $('.loading').removeClass('visible');

  },

  marketServedFix: function () {
    var imageCTAs = $('.image-cta');

    if (imageCTAs.length > 0) {
      imageCTAs.each(function () {
        $(this).find('a').wrapInner('<span></span>');
      });
    }
  },

  initCurrencySelector: function () {
    var currencySelector = $('.CurrencySelect');

    if (currencySelector.length > 0) {
      currencySelector.on("change", function () {
        currencySelector.closest('table').find('.c2btnselectcurrency').trigger('click');
      });
    }
  },

  addSelectRule: function () {
    var selectors = Array.prototype.slice.call(document.querySelectorAll('.c2form_row select[name^="ef"]'));
    selectors.forEach(function (selector) {
      var row = Element.prototype.closest ? selector.closest('.c2form_row') : $(selector).closest('.c2form_row').get(0);
      var label = row.querySelector('label').innerText.replace(':', '').replace('*', '');

      var option = document.createElement("option");
      option.text = "-- Select " + label + " --";
      option.setAttribute("selected", "true");
      option.setAttribute("disabled", "true");

      Element.prototype.prepend ? selector.prepend(option) : $(selector).prepend($(option));
    });
  },

  prettyMessenger: function () {
    var messageContent = $('.message .MsgText');

    if (messageContent.length > 0) {
      var message = $('.message');

      // Display the messages in 0.5s
      setTimeout(function () {
        message.addClass('display')
      }, 500);

      // Add Close Handler
      $('.message__close').click(function () {
        message.removeClass('display');
      });
    }
  },

  initSearchBox: function () {
    // Open
    $('.header__top__search > a').click(function (e) {
      if ($(window).width() > 800) {
        e.preventDefault();
        $(this).next().toggleClass('popped');
      }
    });
    // Close
    $('.header__top__search__box__close').click(function (e) {
      $('.header__top__search__box').toggleClass('popped');
    });
  },

  initMMenu: function () {
    $("#main-menu").mmenu(
      {
        extensions: ["position-right"],
      },
      {
        clone: true,
        offCanvas: {
          pageSelector: "#wrap",
        },
      }
    );

    var api = $("#mm-main-menu").data("mmenu");

    $("#menu-toggle").click(function (e) {
      e.preventDefault();
      api.open();
    });

    $('a[data-toggle*="#"]').click(function (e) {
      e.preventDefault();
      var target = $(this).attr("data-toggle");

      if ($(target)) {
        $(target).toggleClass("popped");
      }
    });
  },

  removeEmptyRelatedContentItems: function () {
    var relProdWrapper = $('.lcm-related-product-wrapper');

    if (relProdWrapper.length > 0) {
      relProdWrapper.each(function () {
        if ($(this).children().length == 0) {
          $(this).remove();
        }
      });
    }
  },

  showParentDropDownMenus: function () {
    $('.show-on-popup').each(function () {
      this.querySelectorAll
      var parentText = $(this).find('a.lev1').text(),
        parentLink = $(this).find('a.lev1').attr('href');

      if (parentText == 'About') {
        parentText = 'About LCM Systems';
      }

      $(this).find('ul.lev2').prepend('<li class="lev2 child"><a class="lev2 child" href=' + parentLink + '>' + parentText + '</a></li>');
    });
  },

  hideFormFieldBeforePrevious: function () {
    var hideBeforeFields = Array.prototype.slice.call(document.querySelectorAll(".c2form_fields .c2-form-hide-before-previous"));
    hideBeforeFields.forEach(function (hideBeforeField) {
      // Doesn't have a previous Sibling, so we can't do this logic
      if (!hideBeforeField.previousElementSibling) { return }

      // Add d-none Class
      hideBeforeField.classList.add('d-none')

      var previousInput = hideBeforeField.previousElementSibling.querySelector("input");

      function onChange() {
        // Remove Classes
        hideBeforeField.classList.remove('d-none');
        hideBeforeField.classList.add('d-inherit');
        // Remove Listener
        previousInput.removeEventListener('change', onChange);
      }

      // Add Change Listener to Previous Input
      previousInput.addEventListener('change', onChange);
    });
  },

  accordionFieldSets: function () {
    var activePanel = null
    var accordionFieldSets = Array.prototype.slice.call(document.querySelectorAll(".c2form_fields fieldset:not(:first-of-type)"));

    function handleToggle(panel) {
      panel.legend.classList.toggle("active");
      if (panel.fields.style.maxHeight) {
        panel.fields.style.maxHeight = null;
      } else {
        panel.fields.style.maxHeight = panel.fields.scrollHeight + "px";
      }
    }

    accordionFieldSets.forEach(function (fieldSet) {
      var panel = {
        legend: fieldSet.querySelector('legend'),
        fields: fieldSet.querySelector('.c2form_fields')
      };

      panel.legend.classList.add('accordion');
      panel.fields.classList.add('panel');

      panel.legend.addEventListener('click', function () {
        // Deactivate previous Panel
        if (activePanel && activePanel != panel) {
          handleToggle(activePanel);
        }
        handleToggle(panel);
        if (activePanel == panel) {
          activePanel = null;
        } else {
          activePanel = panel;
        }
      });
    });
  },

  moveBanners: function () {
    $('.lcm-product-detail__banner').each(function () {
      var productBanner = $(this);
      productBanner.insertAfter('#header');
      productBanner.removeClass('d-none');
    });

    $('.lcm-news-detail__banner').each(function () {
      var productBanner = $(this);
      productBanner.insertAfter('#header');
      productBanner.removeClass('d-none');
    });
  },

  initSlick: function () {
    $(".lcm-news-slider__inner > div").slick({
      dots: false,
      infinite: true,
      speed: 300,
      slidesToShow: 5,
      slidesToScroll: 1,
      lazyLoad: 'ondemand',
      responsive: [
        {
          breakpoint: 1024,
          settings: {
            slidesToShow: 5,
            slidesToScroll: 3,
            infinite: true,
            dots: true,
          },
        },
        {
          breakpoint: 600,
          settings: {
            slidesToShow: 2,
            slidesToScroll: 2,
          },
        },
        {
          breakpoint: 480,
          settings: {
            slidesToShow: 1,
            slidesToScroll: 1,
          },
        },
        // You can unslick at a given breakpoint now by adding:
        // settings: "unslick"
        // instead of a settings object
      ],
    });



    $(".lcm-product-slider__inner > div").slick({
      dots: false,
      infinite: true,
      speed: 300,
      slidesToShow: 4,
      slidesToScroll: 1,
      lazyLoad: 'ondemand',
      responsive: [
        {
          breakpoint: 1024,
          settings: {
            slidesToShow: 4,
            infinite: true,
            dots: true,
          },
        },
        {
          breakpoint: 600,
          settings: {
            slidesToShow: 2,
            slidesToScroll: 2,
          },
        },
        {
          breakpoint: 480,
          settings: {
            slidesToShow: 1,
            slidesToScroll: 1,
          },
        },
        // You can unslick at a given breakpoint now by adding:
        // settings: "unslick"
        // instead of a settings object
      ],
    });

    $(".slider .lcm-product-slider__inner > div").slick('unslick');

    $(".slider .lcm-product-slider__inner > div").slick({
      dots: false,
      infinite: true,
      speed: 300,
      slidesToShow: 6,
      slidesToScroll: 1,
      lazyLoad: 'ondemand',
      responsive: [
        {
          breakpoint: 1024,
          settings: {
            slidesToShow: 4,
            infinite: true,
            dots: true,
          },
        },
        {
          breakpoint: 600,
          settings: {
            slidesToShow: 2,
            slidesToScroll: 2,
          },
        },
        {
          breakpoint: 480,
          settings: {
            slidesToShow: 1,
            slidesToScroll: 1,
          },
        },
        // You can unslick at a given breakpoint now by adding:
        // settings: "unslick"
        // instead of a settings object
      ],
    });

    $(".lcm-page-slider__inner > div").slick({
      dots: false,
      infinite: true,
      speed: 300,
      slidesToShow: 6,
      slidesToScroll: 1,
      lazyLoad: 'ondemand',
      responsive: [
        {
          breakpoint: 1024,
          settings: {
            slidesToShow: 5,
            slidesToScroll: 3,
            infinite: true,
            dots: true,
          },
        },
        {
          breakpoint: 600,
          settings: {
            slidesToShow: 2,
            slidesToScroll: 2,
          },
        },
        {
          breakpoint: 480,
          settings: {
            slidesToShow: 1,
            slidesToScroll: 1,
          },
        },
        // You can unslick at a given breakpoint now by adding:
        // settings: "unslick"
        // instead of a settings object
      ],
    });

    $(".banner-slider>div").slick({
      infinite: true,
      speed: 300,
      fade: true,
      slidesToShow: 1,
      slidesToScroll: 1,
      autoplay: true,
      autoplaySpeed: 4000,
      lazyLoad: 'ondemand'
    });
  },


};

export default app;
