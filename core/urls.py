from . import views
from django.urls import path

app_name = 'core' 
urlpatterns = [
    path('transactions', views.transaction_view, name="transactions")
]
