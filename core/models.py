from django.db import models
from django.contrib.auth.models import User


# Create your models here.
class Transactions(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    category = models.CharField(max_length=10, default="Expense")
    description = models.TextField()
    date = models.DateField()

    class Meta:
        ordering = ['-date']


    def __str__(self):
        return f"{self.user.username} - rs {self.amount} on {self.date}"

class Reminder(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reminders')
    title = models.CharField(max_length=200)
    due_date = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    done = models.BooleanField(default=False)

    class Meta:
        ordering = ['-due_date', '-created_at']

    def __str__(self):
        return f"{self.title} ({self.user})"

class Investments(models.Model):
    ASSET_TYPES = [
        ('stock', 'Stock'),
        ('crypto', 'Crypto'),
        ('gold', 'Gold'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    asset_type = models.CharField(max_length=20, choices=ASSET_TYPES)
    symbol = models.CharField(max_length=20)  # e.g., "AAPL", "BTC", "GOLD"
    name = models.CharField(max_length=100)
    invested_amount = models.DecimalField(max_digits=12, decimal_places=2)
    quantity = models.DecimalField(max_digits=12, decimal_places=4)  # how much user bought
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.symbol} - {self.user.username}"