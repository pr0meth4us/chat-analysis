from asgiref.wsgi import WsgiToAsgi
from api.app import create_app

asgi_app = WsgiToAsgi(create_app())
