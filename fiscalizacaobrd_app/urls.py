from django.urls import path
from .views import home, formulario,sync_data

urlpatterns = [
    path("", home, name="home"),
    path("formulario/", formulario, name="formulario"),
    path("sync/", sync_data, name="sync_data"),
    
]
