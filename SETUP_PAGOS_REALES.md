# Pasarela de Pago Coffeu - Configuración de Pagos Reales

## 📋 Resumen

La pasarela soporta 3 métodos de pago:
1. **Stripe** (tarjeta segura con Elements)
2. **PayPal** (redirección a PayPal)
3. **Mercado Pago** (redirección a Mercado Pago)

---

## 🔧 Configuración Rápida

### 1. Stripe (Recomendado - Ya configurado parcialmente)

**Paso 1**: Obtén tus claves
- Ve a https://dashboard.stripe.com/
- Copia tu `Publishable key` (comienza con `pk_test_`)

**Paso 2**: Actualiza la meta tag en `view/pasarela-pago.html`
```html
<meta name="stripe-pk" content="pk_test_TU_CLAVE_AQUI" />
```

**Paso 3**: Configura el backend Django
```bash
pip install stripe
```

En tu `views.py`:
```python
import stripe
import os

stripe.api_key = os.getenv('STRIPE_SECRET_KEY')

@csrf_exempt
def create_payment_intent(request):
    try:
        intent = stripe.PaymentIntent.create(
            amount=2849,  # $28.49 en centavos
            currency='usd',
            automatic_payment_methods={'enabled': True}
        )
        return JsonResponse({'clientSecret': intent.client_secret})
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)
```

**Paso 4**: URLs en `urls.py`
```python
path('create-payment-intent/', views.create_payment_intent),
```

---

### 2. PayPal

**Opción A: Método Estándar (Más simple)**

**Paso 1**: Registrate en PayPal Business
- https://www.paypal.com/business

**Paso 2**: Obtén tu email de PayPal
- Configuración → Cuentas → Email de la cuenta

**Paso 3**: Actualiza `js/pasarela-pago.js`
```javascript
paypalCheckoutUrl.searchParams.append('business', 'tu-email@paypal.com');
```

**Paso 4**: Configura URLs de retorno en PayPal
- Cuenta → Configuración → Opciones de pago
- Return URL: `https://tudominio.com/view/pasarela-pago.html?success=paypal`
- Cancel URL: `https://tudominio.com/view/pasarela-pago.html?cancel=true`

**Opción B: SDK de PayPal (Mejor UX)**

**Paso 1**: Obtén tu Client ID
- https://developer.paypal.com/dashboard/
- Copia tu `Client ID`

**Paso 2**: Descomenta el SDK en `view/pasarela-pago.html`
```html
<script src="https://www.paypal.com/sdk/js?client-id=TU_CLIENT_ID&currency=USD"></script>
```

**Paso 3**: Descomenta el código en `js/pasarela-pago.js`
```javascript
if (typeof paypal !== 'undefined') {
  // ... código del SDK habilitado
}
```

---

### 3. Mercado Pago

**Paso 1**: Registrate en Mercado Pago
- https://www.mercadopago.com.ar (o tu país)

**Paso 2**: Obtén tus credenciales
- Panel de Control → Configuración → Credenciales
- Copia: `Client ID`, `Client Secret`, `Access Token`

**Paso 3**: Instala la librería
```bash
pip install mercado-pago-sdk
```

**Paso 4**: Configura variables de entorno (`.env`)
```
MERCADOPAGO_CLIENT_ID=xxx
MERCADOPAGO_CLIENT_SECRET=xxx
MERCADOPAGO_ACCESS_TOKEN=xxx
```

**Paso 5**: Copia el código de ejemplo
- Copia `views_payment_example.py` a tu app de Django
- Actualiza tus `urls.py` con las rutas del ejemplo

**Paso 6**: Descomenta el SDK si lo prefieres (alternativa)
```html
<!-- En view/pasarela-pago.html -->
<script src="https://secure.mlstatic.com/sdk/javascript/v1/mercadopago.js"></script>
```

---

## 🧪 Testing

### Stripe Testing
```bash
# Tarjeta de prueba exitosa
4242 4242 4242 4242

# Vencimiento: cualquier fecha futura (ej: 12/25)
# CVC: cualquier 3 dígitos (ej: 123)
```

### PayPal Testing
1. Ve a https://developer.paypal.com/dashboard/
2. Crea cuentas de sandbox (Buyer y Seller)
3. Usa esas credenciales para probar

### Mercado Pago Testing
1. Usa https://sandbox.mercadopago.com.ar
2. El `access_token` de sandbox es diferente
3. Las transacciones no son reales

---

## 📁 Archivos Importantes

```
view/pasarela-pago.html          ← Meta tags y SDKs
js/pasarela-pago.js              ← Lógica de redirección
styles/pasarela-pago.css         ← Estilos
INTEGRACION_PAYPAL_MERCADOPAGO.md ← Docs completas
views_payment_example.py         ← Backend ejemplo
```

---

## ⚠️ Seguridad

1. **NUNCA** expongas claves secretas en el frontend
2. Guarda todo en variables de entorno (`.env`)
3. Usa HTTPS en producción
4. Valida montos en el backend
5. Implementa webhooks para validar pagos
6. Mantén registros de todas las transacciones

---

## 🚀 Deploy a Producción

1. Obtén claves de producción (no sandbox/test)
2. Actualiza todas las variables de entorno
3. Cambia URLs de retorno a tu dominio real
4. Prueba en staging primero
5. Implementa logging y monitoreo
6. Configura SSL/HTTPS
7. Documenta el proceso de rollback

---

## 📞 Soporte

- **Stripe**: https://stripe.com/docs
- **PayPal**: https://developer.paypal.com/docs
- **Mercado Pago**: https://developers.mercadopago.com/

---

## 🎯 Estado Actual

✅ Frontend HTML/CSS/JS completo
✅ Integración Stripe Elements (parcial)
⏳ Backend Stripe (necesita tu Secret Key)
⏳ PayPal (necesita configuración)
⏳ Mercado Pago (necesita credenciales)

**Próximos pasos**: Configura tus credenciales en los archivos de backend y prueba localmente.
