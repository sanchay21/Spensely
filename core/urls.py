from . import views
from django.urls import path

app_name = 'core' 
urlpatterns = [
    path('dashboard', views.dashboard_view, name="dashboard"),
    path('transactions', views.transaction_view, name="transactions"),
    path('transactions/add/', views.transactions_add, name='transactions_add'),
    path('transactions/edit/<int:id>/', views.transactions_edit, name='transactions_edit'),
    path('transactions/delete/', views.transactions_delete, name='transactions_delete'),
    path('investments', views.investment_view, name="investments"),
    path('api/chart-data/', views.get_chart_data, name='chart_data'),
    path('api/ai-insights/', views.get_ai_insights, name='ai_insights'),
    path('api/reminders/add/', views.add_reminder, name='add_reminder'),
    path('api/reminders/<int:reminder_id>/toggle/', views.toggle_reminder, name='toggle_reminder'),
    path('api/reminders/<int:reminder_id>/delete/', views.delete_reminder, name='delete_reminder'),
]
