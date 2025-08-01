from django.db import models
from django.contrib.auth.models import User


# Create your models here.
class Transactions(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    description = models.TextField()
    date = models.DateField()

    def __str__(self):
        return f"{self.user.username} - rs {self.amount} on {self.date}"
