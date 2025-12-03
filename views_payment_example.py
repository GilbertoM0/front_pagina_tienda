# views_payment_example.py
# Ejemplo de vistas Django para manejar pagos con Mercado Pago

import os
import json
import mercadopago
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

# Configurar cliente de Mercado Pago
mp = mercadopago.Client(
    client_id=os.getenv('MERCADOPAGO_CLIENT_ID'),
    client_secret=os.getenv('MERCADOPAGO_CLIENT_SECRET'),
    access_token=os.getenv('MERCADOPAGO_ACCESS_TOKEN')
)


@require_http_methods(["POST"])
@csrf_exempt
def create_mercadopago_preference(request):
    """
    Crear una preferencia de pago en Mercado Pago.
    El frontend llama a este endpoint para obtener el init_point (URL de checkout).
    """
    try:
        data = json.loads(request.body)
        items = data.get('items', [])
        
        if not items:
            return JsonResponse({'error': 'No items provided'}, status=400)
        
        # Construir la preferencia
        preference_data = {
            "items": [
                {
                    "id": item.get('id', 'item'),
                    "title": item.get('name', 'Producto'),
                    "quantity": item.get('quantity', 1),
                    "currency_id": "USD",  # Cambiar según tu país/moneda
                    "unit_price": float(item.get('price', 0))
                }
                for item in items
            ],
            "payer": {
                # Opcional: incluir datos del pagador
            },
            "back_urls": {
                "success": request.build_absolute_uri('/payment/success/'),
                "failure": request.build_absolute_uri('/payment/failure/'),
                "pending": request.build_absolute_uri('/payment/pending/')
            },
            "auto_return": "approved",
            "notification_url": request.build_absolute_uri('/webhook/mercadopago/'),
            "expires": False,
            "external_reference": f"order_{request.user.id if request.user.is_authenticated else 'guest'}",
        }
        
        # Crear la preferencia
        preference_response = mp.preference().create(preference_data)
        
        if preference_response['status'] == 201:
            return JsonResponse({
                'init_point': preference_response['response']['init_point'],
                'preference_id': preference_response['response']['id']
            })
        else:
            return JsonResponse({
                'error': 'Error creating preference',
                'details': preference_response
            }, status=400)
            
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def mercadopago_webhook(request):
    """
    Webhook para recibir notificaciones de Mercado Pago.
    Se ejecuta cuando el pago se procesa.
    """
    try:
        # Mercado Pago envía 'type' y 'data.id' como parámetros
        payment_type = request.GET.get('type')
        payment_id = request.GET.get('data.id')
        
        if payment_type == 'payment':
            # Obtener detalles del pago
            payment = mp.payment().get(payment_id)
            payment_data = payment['response']
            
            # Extraer información relevante
            status = payment_data['status']
            amount = payment_data['transaction_amount']
            external_reference = payment_data.get('external_reference')
            merchant_order_id = payment_data['order'].get('id') if payment_data.get('order') else None
            
            # Guardar la información en tu BD
            # Ejemplo: Order.objects.filter(id=external_reference).update(status=status, mp_payment_id=payment_id)
            
            print(f"Pago recibido: {payment_id}, Status: {status}, Monto: {amount}")
            
            # Aquí implementa tu lógica:
            # - Si status == 'approved': marcar pedido como pagado
            # - Si status == 'pending': marcar como pendiente
            # - Si status == 'rejected': marcar como rechazado
            
        return HttpResponse(status=200)
        
    except Exception as e:
        print(f"Error en webhook: {e}")
        return HttpResponse(status=400)


@require_http_methods(["GET"])
def payment_success(request):
    """
    Página de éxito después del pago en Mercado Pago.
    """
    payment_id = request.GET.get('payment_id')
    status = request.GET.get('status')
    external_reference = request.GET.get('external_reference')
    
    # Aquí puedes verificar el pago consultando la API si lo deseas
    if payment_id:
        payment = mp.payment().get(payment_id)
        payment_status = payment['response']['status']
    
    # Redirigir o renderizar una página de éxito
    return JsonResponse({
        'message': 'Pago completado exitosamente',
        'payment_id': payment_id,
        'status': status
    })


@require_http_methods(["GET"])
def payment_failure(request):
    """
    Página de fallo después del pago en Mercado Pago.
    """
    return JsonResponse({
        'message': 'El pago fue cancelado o falló',
        'reason': request.GET.get('reason', 'Unknown')
    }, status=400)


@require_http_methods(["GET"])
def payment_pending(request):
    """
    Página de pago pendiente en Mercado Pago.
    """
    return JsonResponse({
        'message': 'Tu pago está siendo procesado'
    })


# URLs a agregar en urls.py:
"""
from django.urls import path
from . import views

urlpatterns = [
    path('create-mercadopago-preference/', views.create_mercadopago_preference, name='create_mp_preference'),
    path('webhook/mercadopago/', views.mercadopago_webhook, name='mp_webhook'),
    path('payment/success/', views.payment_success, name='payment_success'),
    path('payment/failure/', views.payment_failure, name='payment_failure'),
    path('payment/pending/', views.payment_pending, name='payment_pending'),
]
"""


# Variables de entorno (.env):
"""
MERCADOPAGO_CLIENT_ID=your_client_id
MERCADOPAGO_CLIENT_SECRET=your_client_secret
MERCADOPAGO_ACCESS_TOKEN=your_access_token
"""


# Configuración en settings.py:
"""
import os
from dotenv import load_dotenv

load_dotenv()

MERCADOPAGO_CLIENT_ID = os.getenv('MERCADOPAGO_CLIENT_ID')
MERCADOPAGO_CLIENT_SECRET = os.getenv('MERCADOPAGO_CLIENT_SECRET')
MERCADOPAGO_ACCESS_TOKEN = os.getenv('MERCADOPAGO_ACCESS_TOKEN')
"""
