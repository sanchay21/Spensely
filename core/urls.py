from . import views
from django.urls import path

app_name = 'core' 
urlpatterns = [
    path('dashboard', views.dashboard_view, name="dashboard"),
    path('transactions', views.transaction_view, name="transactions"),
    path('transactions/add/', views.transactions_add, name='transactions_add'),
    path('transactions/edit/<int:id>/', views.transactions_edit, name='transactions_edit'),
    path('transactions/delete/', views.transactions_delete, name='transactions_delete'),
    path('investments', views.investments_view, name="investments"),
]
