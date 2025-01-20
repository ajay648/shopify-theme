$(document).ready(function () {
  $.getScript("//cdnjs.cloudflare.com/ajax/libs/fancybox/2.1.5/jquery.fancybox.min.js").done(function () {
    quickView();
  });
});

function quickView() {
  $(".quick-view").click(function () {
    if ($('#quick-view').length === 0) {
      $("body").append('<div id="quick-view"></div>');
    }

    const product_handle = $(this).data('handle');
    console.log("Product Handle (on quick view click):", product_handle); // Debugging line

    if (!product_handle) {
      console.error("Product handle is missing! Ensure the data-handle attribute is set.");
      return;
    }

    $('#quick-view').addClass(product_handle);

    // Construct the correct URL for the product data
    const productUrl = `/products/${product_handle}.js`;

    console.log("Product URL:", productUrl); // Debugging line

    $.getJSON(productUrl, function (product) {
      const { title, type, description: desc, images, options, variants } = product;
      const url = '/products/' + product_handle;

      // Populate product data
      $('.qv-product-title').text(title);
      $('.qv-product-type').text(type);
      $('.qv-product-description').html(desc);
      $('.view-product').attr('href', url);

      // Handle images
      $('.qv-product-images').empty();
      images.forEach((image) => {
        let image_embed = `<div><img src="${image.replace('.jpg', '_800x.jpg').replace('.png', '_800x.png')}"></div>`;
        $('.qv-product-images').append(image_embed);
      });

      $('.qv-product-images').slick({
        dots: false,
        arrows: false,
        respondTo: 'min',
        useTransform: false,
      }).css('opacity', '1');

      // Handle options
      $('.qv-product-options').empty();
      options.forEach((option, i) => {
        const opt = option.name;
        $('.qv-product-options').append(`
          <div class="option-selection-${opt.toLowerCase()}">
            <span class="option">${opt}</span>
            <select class="option-${i} option ${opt.toLowerCase()}"></select>
          </div>
        `);
        option.values.forEach((value) => {
          $(`.option.${opt.toLowerCase()}`).append(`<option value="${value}">${value}</option>`);
        });
      });

      // Handle variants
      variants.forEach((variant) => {
        const price = parseFloat(variant.price / 100).toFixed(2);
        const original_price = parseFloat(variant.compare_at_price / 100).toFixed(2);

        if (variant.inventory_quantity === 0) {
          $('.qv-add-button').prop('disabled', true).val('Sold Out');
          $('.qv-add-to-cart').hide();
          $('.qv-product-price').text('Sold Out').show();
        } else {
          $('.qv-product-price').text(`$${price}`);
          if (original_price > 0) {
            $('.qv-product-original-price').text(`$${original_price}`).show();
          } else {
            $('.qv-product-original-price').hide();
          }
        }
      });
    }).fail(function (jqxhr, textStatus, error) {
      console.error("Error fetching product data: ", textStatus, error);
    });

    // Initialize Fancybox
    $.fancybox({
      href: '#quick-view',
      maxWidth: 100,
      maxHeight: 600,
      fitToView: true,
      width: '75%',
      height: '70%',
      autoSize: false,
      closeClick: false,
      openEffect: 'none',
      closeEffect: 'none',
      beforeLoad: function () {
        const product_handle = $('#quick-view').attr('class');
        $(document).on("click", ".qv-add-button", function () {
          const qty = $('.qv-quantity').val();
          let selectedOptions = '';
          $('#quick-view select').each(function () {
            selectedOptions += selectedOptions ? ` / ${$(this).val()}` : $(this).val();
          });

          // Debugging: check product handle and selected options
          console.log("Product Handle (before Add to Cart):", product_handle);
          console.log("Selected Options:", selectedOptions);

          // Ensure the product handle is not empty
          if (!product_handle) {
            console.error("Product handle is missing! Cannot add to cart.");
            return;
          }

          $.getJSON(`/products/${product_handle}.js`, function (product) {
            product.variants.forEach((variant) => {
              if (variant.title === selectedOptions) {
                const var_id = variant.id;

                // Add to cart
                $.post('/cart/add.js', { quantity: qty, id: var_id }, null, "json")
                  .done(function () {
                    $('.qv-add-to-cart-response').addClass('success').html(`
                      <span>${$('.qv-product-title').text()} has been added to your cart. 
                      <a href="/cart">Click here to view your cart.</a>
                    `);
                  })
                  .fail(function ($xhr) {
                    const data = $xhr.responseJSON;
                    $('.qv-add-to-cart-response').addClass('error').html(`<span><b>ERROR: </b>${data.description}</span>`);
                  });
              }
            });
          });
        });
      },
      afterShow: function () {
        $('#quick-view').hide().html($('#quick-view').html()).fadeIn(() => {
          $('.qv-product-images').addClass('loaded');
        });
      },
      afterClose: function () {
        $('#quick-view').removeClass().empty();
      },
    });
  });

  $(document).on("change", "#quick-view select", function () {
    const product_handle = $('#quick-view').attr('class');
    let selectedOptions = '';
    $('#quick-view select').each(function () {
      selectedOptions += selectedOptions ? ` / ${$(this).val()}` : $(this).val();
    });

    $.getJSON(`/products/${product_handle}.js`, function (product) {
      product.variants.forEach((variant) => {
        if (variant.title === selectedOptions) {
          const price = parseFloat(variant.price / 100).toFixed(2);
          $('.qv-product-price').text(`$${price}`);
          if (variant.inventory_quantity < 1) {
            $('.qv-add-button').prop('disabled', true).val('Sold Out');
          } else {
            $('.qv-add-button').prop('disabled', false).val('Add to Cart');
          }
        }
      });
    });
  });
}

$(window).resize(function () {
  if ($('#quick-view').is(':visible')) {
    $('.qv-product-images').slick('setPosition');
  }
});
