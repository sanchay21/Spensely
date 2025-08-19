from django.contrib import admin
from .models import Transactions, Investments

# Register your models here.
admin.site.register(Transactions)
admin.site.register(Investments)