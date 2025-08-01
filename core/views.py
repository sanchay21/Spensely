from django.shortcuts import render, HttpResponse, redirect
from .models import Transactions

# Create your views here.
def index(request):
    return HttpResponse("Hello Wolrd!!")

def transaction_view(request):

    if (request.method == "POST"):
        amount = request.POST.get('amount')
        desc = request.POST.get('desc')
        date = request.POST.get('date')

        transaction = Transactions.objects.create(
            user = request.user,
            amount = amount,
            description = desc,
            date = date
        )
        print("Transaction Added !")
        return redirect('core:transactions')
        
    
    return render(request, 'core/transactions.html')