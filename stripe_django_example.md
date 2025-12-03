# Ejemplo de backend Django para Stripe (PaymentIntents)

Este archivo muestra ejemplos mínimos para crear un `PaymentIntent` desde Django y manejar webhooks. No incluyas la llave secreta en el repositorio; usa variables de entorno.

1) Instalar dependencia

```bash
pip install stripe
```

2) Configurar variables de entorno (ejemplo en `.env` o en settings)

- `STRIPE_SECRET_KEY=sk_test_xxx`
- `STRIPE_WEBHOOK_SECRET=whsec_xxx`

3) `views.py` (ejemplo)

```python
import os
import stripe
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt

stripe.api_key = os.environ.get('STRIPE_SECRET_KEY')

@csrf_exempt
def create_payment_intent(request):
    try:
        data = json.loads(request.body)
        # Calcula el monto en centavos según tu lógica
        amount = 2849  # $28.49 => 2849 centavos (ejemplo fijo)
        intent = stripe.PaymentIntent.create(
            amount=amount,
            currency='usd',
            automatic_payment_methods={'enabled': True},
        )
        return JsonResponse({'clientSecret': intent.client_secret})
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)


@csrf_exempt
def stripe_webhook(request):
    payload = request.body
    sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')
    webhook_secret = os.environ.get('STRIPE_WEBHOOK_SECRET')
    try:
        event = stripe.Webhook.construct_event(payload, sig_header, webhook_secret)
    except ValueError:
        return HttpResponse(status=400)
    except stripe.error.SignatureVerificationError:
        return HttpResponse(status=400)

    # Maneja eventos según necesites
    if event['type'] == 'payment_intent.succeeded':
        intent = event['data']['object']
        # marca pedido como pagado en tu BD

    return HttpResponse(status=200)
```

4) `urls.py`

```python
from django.urls import path
from . import views

urlpatterns = [
    path('create-payment-intent/', views.create_payment_intent, name='create-payment-intent'),
    path('stripe-webhook/', views.stripe_webhook, name='stripe-webhook'),
]
```

5) Pruebas locales

- Usa la CLI de Stripe para reenviar webhooks a tu servidor local:

```bash
stripe listen --forward-to localhost:8000/stripe-webhook/
```

- Asegúrate de exponer tus variables de entorno y que el endpoint `/create-payment-intent/` esté accesible desde el front.

6) Notas de seguridad

- Nunca envíes claves secretas al cliente.
- Usa `automatic_payment_methods` o configura `payment_method_types` según necesites.
- Para producción, valida montos en base a tu carrito en el servidor.
