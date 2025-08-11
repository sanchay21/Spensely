from . import views
from django.urls import path

app_name = 'core' 
urlpatterns = [
    path('transactions', views.transaction_view, name="transactions"),
    path('transactions/add/', views.transactions_add, name='transactions_add'),
    path('transactions/delete/', views.transactions_delete, name='transactions_delete'),
]
