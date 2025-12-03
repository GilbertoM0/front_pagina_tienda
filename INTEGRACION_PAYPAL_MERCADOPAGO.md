# Integración de PayPal y Mercado Pago

## PayPal

### Opción 1: Estándar (más simple)

1. **Registra tu cuenta en PayPal**:
   - Ve a https://www.paypal.com/business
   - Crea una cuenta de negocio
   - Ve a "Configuración" → "Cuentas" y obtén tu email de negocio

2. **Actualiza el código en `js/pasarela-pago.js`**:
   ```javascript
   paypalCheckoutUrl.searchParams.append('business', 'tu-email@paypal.com');
   ```

3. **Configura URLs de retorno** en PayPal:
   - Cuenta de PayPal → Configuración → Opciones de pago
   - Return URL: `https://tudominio.com/view/pasarela-pago.html?success=true`
   - Cancel URL: `https://tudominio.com/view/pasarela-pago.html?cancel=true`

4. **Para testing**: Usa tus datos reales de PayPal Sandbox:
   - https://developer.paypal.com/
   - Crear cuenta de sandbox
   - Usar credenciales de sandbox para pruebas

### Opción 2: PayPal Checkout (recomendado)

Para una experiencia mejor, usa el SDK de PayPal:

```html
<!-- En view/pasarela-pago.html, en <head> o antes de </body> -->
<script src="https://www.paypal.com/sdk/js?client-id=TU_CLIENT_ID"></script>
```

```javascript
// En js/pasarela-pago.js
paypalPayBtn.addEventListener('click', () => {
  paypal.Buttons({
    createOrder: (data, actions) => {
      return actions.order.create({
        purchase_units: [{
          amount: { value: '28.49' },
          description: 'Café Coffeu — Pack Premium'
        }]
      });
    },
    onApprove: (data, actions) => {
      return actions.order.capture().then(() => {
        alert('Pago completado en PayPal!');
        window.location.href = '/view/pasarela-pago.html?success=true';
      });
    },
    onError: (err) => {
      console.error('Error en PayPal:', err);
      alert('Error al procesar el pago con PayPal');
    }
  }).render('#paypal-button-container');
});
```

---

## Mercado Pago

### Requisitos:

1. **Registra tu cuenta en Mercado Pago**:
   - Ve a https://www.mercadopago.com.ar (o tu país)
   - Crea una cuenta de vendedor
   - Obtén tu `ACCESS_TOKEN` en Configuración → Credenciales

2. **Instala la librería en tu backend (Django)**:
   ```bash
   pip install mercado-pago-sdk
   ```

### Opción 1: Preferencia de pago (recomendado)

**Backend (Django - ejemplo en views.py)**:

```python
import mercadopago

mp_client = mercadopago.Client(access_token='TU_ACCESS_TOKEN')

def create_mercadopago_preference(request):
    preference_data = {
        "items": [
            {
                "title": "Café Coffeu — Pack Premium",
                "quantity": 1,
                "currency_id": "ARS",  # o "USD", "MXN", etc.
                "unit_price": 28.49
            }
        ],
        "back_urls": {
            "success": request.build_absolute_uri('/success/'),
            "failure": request.build_absolute_uri('/failure/'),
            "pending": request.build_absolute_uri('/pending/')
        },
        "auto_return": "approved",
    }
    
    preference_response = mp_client.preference().create(preference_data)
    
    if preference_response['status'] == 201:
        return JsonResponse({
            'init_point': preference_response['response']['init_point'],
            'id': preference_response['response']['id']
        })
    return JsonResponse({'error': 'Error creando preferencia'}, status=400)
```

**Frontend (js/pasarela-pago.js)**:

```javascript
mpPayBtn.addEventListener('click', async () => {
  try {
    const response = await fetch('/create-mercadopago-preference/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    const data = await response.json();
    
    if (data.init_point) {
      // Redirigir a Mercado Pago
      window.location.href = data.init_point;
    } else {
      alert('Error creando preferencia de Mercado Pago');
    }
  } catch (err) {
    console.error('Error:', err);
    alert('Error al conectar con Mercado Pago');
  }
});
```

### Opción 2: SDK de Mercado Pago (en el navegador)

```html
<!-- En view/pasarela-pago.html -->
<script src="https://secure.mlstatic.com/sdk/javascript/v1/mercadopago.js"></script>
```

```javascript
// En js/pasarela-pago.js
mpPayBtn.addEventListener('click', () => {
  // Configura la llave pública
  const mp = new MercadoPago('TU_PUBLIC_KEY', {
    locale: 'es-AR'  // Cambia según tu país
  });
  
  mp.checkout({
    preference: {
      items: [
        {
          title: 'Café Coffeu — Pack Premium',
          quantity: 1,
          currency_id: 'ARS',
          unit_price: 28.49
        }
      ]
    },
    autoOpen: true
  });
});
```

---

## URLs de Prueba

### PayPal Sandbox
- **Merchant Dashboard**: https://developer.paypal.com/dashboard/
- **Sandbox Testing**: Usa cuentas de prueba creadas en la plataforma

### Mercado Pago Sandbox
- **Sandbox URL**: https://sandbox.mercadopago.com.ar
- **Cambiar en credenciales**: Usar `sandbox_access_token` en lugar de `access_token`

---

## Checklist de seguridad

- [ ] Nunca expongas `access_token` o `client_id` en el frontend
- [ ] Valida montos en el backend
- [ ] Verifica webhooks de ambas plataformas
- [ ] Usa HTTPS en producción
- [ ] Guarda los tokens en variables de entorno (`.env`)
- [ ] Implementa reintentos en caso de fallo
- [ ] Mantén registros de transacciones en tu BD

---

## Variables de entorno (Django)

```
# .env
PAYPAL_EMAIL=tu-email@paypal.com
PAYPAL_CLIENT_ID=xxx
PAYPAL_SECRET=xxx

MERCADOPAGO_ACCESS_TOKEN=xxx
MERCADOPAGO_PUBLIC_KEY=xxx
```

Cargarlas en `settings.py`:
```python
import os
from dotenv import load_dotenv

load_dotenv()
PAYPAL_EMAIL = os.getenv('PAYPAL_EMAIL')
MERCADOPAGO_ACCESS_TOKEN = os.getenv('MERCADOPAGO_ACCESS_TOKEN')
```
