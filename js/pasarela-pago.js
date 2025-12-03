document.addEventListener('DOMContentLoaded', () => {
  // Cargar carrito desde localStorage
  const cart = JSON.parse(localStorage.getItem('shoppingCart')) || [];
  const orderItemsContainer = document.getElementById('order-items');
  const orderTotalElement = document.getElementById('order-total');
  
  // Función para formatear moneda (Pesos Mexicanos)
  const formatter = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });
  
  // Cargar y mostrar items del carrito
  if (cart.length > 0) {
    let total = 0;
    orderItemsContainer.innerHTML = '';
    
    cart.forEach(item => {
      const itemTotal = item.price * item.quantity;
      total += itemTotal;
      
      orderItemsContainer.innerHTML += `
        <div class="summary-item">
          <div>
            <span class="item-name">${item.name}</span>
            <span style="font-size: 12px; color: #999; display: block;">${item.quantity} × ${formatter.format(item.price)}</span>
          </div>
          <span class="item-price">${formatter.format(itemTotal)}</span>
        </div>
      `;
    });
    
    // Mostrar total
    orderTotalElement.textContent = formatter.format(total);
  } else {
    orderItemsContainer.innerHTML = '<p style="text-align: center; color: #999;">Tu carrito está vacío</p>';
    orderTotalElement.textContent = '$0.00';
  }

  // Inicialización de Stripe si está configurada
  const stripeMeta = document.querySelector('meta[name="stripe-pk"]');
  const stripePublicKey = stripeMeta ? stripeMeta.content : '';
  let stripe = null;
  let elements = null;
  let cardElement = null;
  const useStripe = stripePublicKey && !stripePublicKey.includes('REEMPLAZA');

  // Inicializar Stripe
  if (useStripe) {
    try {
      stripe = Stripe(stripePublicKey);
      elements = stripe.elements();
      const style = {
        base: {
          color: '#222',
          fontSize: '14px',
          fontFamily: 'inherit',
          '::placeholder': { color: '#999' },
        },
        invalid: { color: '#ef4444' },
      };
      cardElement = elements.create('card', { hidePostalCode: true, style });
      const mount = document.getElementById('stripe-card-element');
      if (mount) {
        cardElement.mount(mount);
        // Mostrar/ocultar campos fallback
        document.querySelector('.raw-card-fields').classList.add('hidden');
      }
    } catch (err) {
      console.warn('Stripe init failed:', err);
    }
  }

  // Elementos del DOM
  const form = document.getElementById('payment-form');
  const paymentTabs = document.querySelectorAll('.payment-tab');
  const paymentPanels = document.querySelectorAll('.payment-panel');
  const payBtn = document.getElementById('pay-btn');
  const cancelBtn = document.getElementById('cancel-btn');
  
  // Campos Stripe
  const cardNameStripeInput = document.getElementById('card-name-stripe');
  const cardPostalInput = document.getElementById('card-postal');
  
  // Campos manuales
  const cardNumberInput = document.getElementById('card-number');
  const cardNameManualInput = document.getElementById('card-name-manual');
  const cardExpInput = document.getElementById('card-exp');
  const cardCvcInput = document.getElementById('card-cvc');
  const cardPostalManualInput = document.getElementById('card-postal-manual');
  const cardCountryInput = document.getElementById('card-country');
  const cardBrandSpan = document.getElementById('card-brand');
  const cardErrorsDiv = document.getElementById('card-errors');
  
  // Botones externos
  const paypalPayBtn = document.getElementById('paypal-pay');
  const mpPayBtn = document.getElementById('mp-pay');

  // Cambiar entre métodos de pago
  function switchPaymentMethod(method) {
    paymentTabs.forEach(tab => {
      const isActive = tab.dataset.method === method;
      tab.classList.toggle('active', isActive);
      tab.setAttribute('aria-selected', isActive);
    });

    paymentPanels.forEach(panel => {
      panel.classList.toggle('active', panel.dataset.panel === method);
    });
  }

  paymentTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      switchPaymentMethod(tab.dataset.method);
    });
  });

  // Validación Luhn
  function luhnCheck(num) {
    const arr = (num + '').split('').reverse().map(x => parseInt(x, 10));
    let sum = 0;
    for (let i = 0; i < arr.length; i++) {
      let v = arr[i];
      if (i % 2 === 1) {
        v *= 2;
        if (v > 9) v -= 9;
      }
      sum += v;
    }
    return sum % 10 === 0;
  }

  // Detectar marca de tarjeta
  function detectCardBrand(number) {
    const n = number.replace(/\s+/g, '');
    if (/^4/.test(n)) return 'VISA';
    if (/^5[1-5]/.test(n) || /^2(2|3|4|5)/.test(n)) return 'Mastercard';
    if (/^3[47]/.test(n)) return 'AMEX';
    return '';
  }

  // Formatear número de tarjeta
  function formatCardNumber(v) {
    return v.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim();
  }

  // Eventos de validación de tarjeta (fallback)
  cardNumberInput.addEventListener('input', e => {
    const val = formatCardNumber(e.target.value);
    e.target.value = val;
    const brand = detectCardBrand(val);
    cardBrandSpan.textContent = brand || '●●●';
    e.target.classList.remove('error', 'success');
    const digits = val.replace(/\s/g, '');
    if (digits.length >= 12) {
      if (luhnCheck(digits)) {
        e.target.classList.add('success');
      } else {
        e.target.classList.add('error');
      }
    }
  });

  cardExpInput.addEventListener('input', e => {
    let v = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (v.length >= 3) v = v.slice(0, 2) + '/' + v.slice(2);
    e.target.value = v;
  });

  // Manejador de errores de Stripe
  if (cardElement) {
    cardElement.addEventListener('change', e => {
      cardErrorsDiv.textContent = e.error ? e.error.message : '';
    });
  }

  // Botones externos
  paypalPayBtn.addEventListener('click', () => {
    payBtn.disabled = true;
    payBtn.textContent = 'Redirigiendo a PayPal...';
    
    // Opción 1: PayPal estándar (IPN)
    const paypalCheckoutUrl = new URL('https://www.paypal.com/cgi-bin/webscr');
    paypalCheckoutUrl.searchParams.append('cmd', '_xclick');
    paypalCheckoutUrl.searchParams.append('business', 'tu-email@paypal.com'); // ⚠️ Reemplaza
    paypalCheckoutUrl.searchParams.append('item_name', 'Café Coffeu — Pack Premium');
    paypalCheckoutUrl.searchParams.append('amount', '28.49');
    paypalCheckoutUrl.searchParams.append('currency_code', 'USD');
    paypalCheckoutUrl.searchParams.append('return', window.location.origin + '/view/pasarela-pago.html?success=paypal');
    paypalCheckoutUrl.searchParams.append('cancel_return', window.location.href);
    paypalCheckoutUrl.searchParams.append('notify_url', window.location.origin + '/webhook/paypal/');
    
    // Opción 2: Usar SDK de PayPal (descomenta si lo prefieres)
    // if (typeof paypal !== 'undefined') {
    //   paypal.Buttons({...}).render('#paypal-button-container');
    // } else {
    //   window.location.href = paypalCheckoutUrl.toString();
    // }
    
    window.location.href = paypalCheckoutUrl.toString();
  });

  mpPayBtn.addEventListener('click', async () => {
    payBtn.disabled = true;
    payBtn.textContent = 'Redirigiendo a Mercado Pago...';
    
    try {
      // Opción 1: Crear preferencia en backend
      const response = await fetch('/create-mercadopago-preference/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [{ id: 'premium_pack', name: 'Café Coffeu — Pack Premium', price: 28.49, quantity: 1 }]
        })
      });
      
      const data = await response.json();
      
      if (data.init_point) {
        window.location.href = data.init_point;
      } else if (data.error) {
        throw new Error(data.error);
      } else {
        throw new Error('Sin init_point en respuesta');
      }
    } catch (err) {
      console.error('Error Mercado Pago:', err);
      payBtn.disabled = false;
      payBtn.textContent = 'Pagar ahora';
      alert('Error al conectar con Mercado Pago. Verifica tu configuración en el backend.\\n\\nDetalles: ' + err.message);
    }
    
    // Opción 2: Usar SDK de Mercado Pago directamente (descomenta si lo usas)
    // if (typeof MercadoPago !== 'undefined') {
    //   const mp = new MercadoPago('TU_PUBLIC_KEY');
    //   mp.checkout({
    //     preference: {
    //       items: [{
    //         title: 'Café Coffeu — Pack Premium',
    //         quantity: 1,
    //         currency_id: 'USD',
    //         unit_price: 28.49
    //       }]
    //     },
    //     autoOpen: true
    //   });
    // }
  });

  // Envío del formulario
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const activePanel = document.querySelector('.payment-panel.active');
    const activeMethod = activePanel.dataset.panel;

    if (activeMethod === 'card') {
      const cardNameStripe = cardNameStripeInput.value.trim() || 'Cliente';
      const cardNameManual = cardNameManualInput.value.trim();

      if (useStripe && stripe && cardElement) {
        // Validar que se completen los campos básicos
        if (!cardNameStripe) {
          return alert('Por favor, ingresa el nombre titular de la tarjeta');
        }
        if (!cardPostalInput.value.trim()) {
          return alert('Por favor, ingresa tu código postal');
        }

        // Flujo con Stripe PaymentIntents
        payBtn.disabled = true;
        payBtn.textContent = 'Procesando...';

        try {
          const response = await fetch('/create-payment-intent/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              items: [{ id: 'premium_pack' }],
              billingDetails: {
                name: cardNameStripe,
                postalCode: cardPostalInput.value.trim(),
              }
            }),
          });

          const data = await response.json();

          if (data.error) {
            throw new Error(data.error);
          }

          const clientSecret = data.clientSecret;
          const result = await stripe.confirmCardPayment(clientSecret, {
            payment_method: {
              card: cardElement,
              billing_details: { 
                name: cardNameStripe,
                address: {
                  postal_code: cardPostalInput.value.trim(),
                }
              },
            },
          });

          if (result.error) {
            cardErrorsDiv.textContent = 'Error: ' + result.error.message;
            payBtn.disabled = false;
            payBtn.textContent = 'Pagar ahora';
          } else if (
            result.paymentIntent &&
            result.paymentIntent.status === 'succeeded'
          ) {
            payBtn.textContent = '✓ Pago confirmado';
            payBtn.style.background = 'var(--success)';
            alert(
              'Pago realizado exitosamente con Stripe (modo demo)\\nID: ' +
                result.paymentIntent.id
            );
            setTimeout(() => {
              window.history.back();
            }, 2000);
          }
        } catch (err) {
          console.error(err);
          cardErrorsDiv.textContent = 'Error: ' + err.message;
          payBtn.disabled = false;
          payBtn.textContent = 'Pagar ahora';
        }
      } else {
        // Flujo de validación manual (fallback)
        if (!cardNameManual) {
          return alert('Por favor, ingresa el nombre titular de la tarjeta');
        }
        if (!cardPostalManualInput.value.trim()) {
          return alert('Por favor, ingresa tu código postal');
        }
        if (!cardCountryInput.value) {
          return alert('Por favor, selecciona tu país');
        }

        const num = cardNumberInput.value.replace(/\s/g, '');
        if (!num || num.length < 12 || !luhnCheck(num)) {
          return alert('Número de tarjeta inválido');
        }
        if (!cardExpInput.value.match(/^(0[1-9]|1[0-2])\/(\d{2})$/)) {
          return alert('Fecha de vencimiento inválida (formato: MM/AA)');
        }
        if (!cardCvcInput.value.match(/^\d{3,4}$/)) {
          return alert('CVC inválido (3-4 dígitos)');
        }

        payBtn.disabled = true;
        payBtn.textContent = 'Procesando...';
        setTimeout(() => {
          payBtn.disabled = false;
          payBtn.textContent = '✓ Pago confirmado';
          payBtn.style.background = 'var(--success)';
          alert(
            'Pago simulado: aprobado (modo demo sin Stripe)\\nTitular: ' + cardNameManual +
            '\\nPaís: ' + cardCountryInput.value +
            '\\n\\nPara usar Stripe realmente, configura tu llave pública en el meta tag stripe-pk'
          );
          setTimeout(() => {
            window.history.back();
          }, 2000);
        }, 1500);
      }
    } else if (activeMethod === 'paypal') {
      paypalPayBtn.click();
    } else if (activeMethod === 'mercadopago') {
      mpPayBtn.click();
    }
  });

  cancelBtn.addEventListener('click', () => {
    window.history.back();
  });
});
