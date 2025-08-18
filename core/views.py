from django.shortcuts import render, HttpResponse, redirect
from .models import Transactions
from django.http import JsonResponse
import json

# Create your views here.
def index(request):
    return HttpResponse("Hello Wolrd!!")

def transaction_view(request):
    """Render the HTML template for transactions"""
    tObjects = Transactions.objects.filter(user=request.user).order_by('-date')
    return render(request, 'core/transactions.html', {"tObjects": tObjects})

def transactions_add(request):

    if (request.method == "POST"):
        amount = request.POST.get('amount')
        desc = request.POST.get('description')
        date = request.POST.get('date')
        category = request.POST.get('category')

        transaction = Transactions.objects.create(
            user = request.user,
            amount = amount,
            description = desc,
            date = date,
            category = category
        )
        print("Transaction Added !")
        return JsonResponse({
            "success": True,
            "id": transaction.id,
            "date": str(transaction.date),
            "category": transaction.category,
            "description": transaction.description,
            "amount": transaction.amount
        })
        
    return JsonResponse({"success": False}, status=400)

def transactions_edit(request, id):
    if(request.method == "POST"):
        amount = request.POST.get('amount')
        desc = request.POST.get('description')
        date = request.POST.get('date')
        category = request.POST.get('category')

        transaction = Transactions.objects.get(id=id)
        if(not transaction):
            return JsonResponse({"success": False, "error": "Transaction does'nt exist"}, status=400)
        
        transaction.amount = amount
        transaction.description = desc
        transaction.date = date
        transaction.category = category
        transaction.save()

        print("Transaction Edited !")
        return JsonResponse({
            "success": True,
            "id": transaction.id,
            "date": str(transaction.date),
            "category": transaction.category,
            "description": transaction.description,
            "amount": transaction.amount
        })
        
    return JsonResponse({"success": False}, status=400)

        

def transactions_delete(request):
    if (request.method == "POST"):
        data = json.loads(request.body)
        transaction_id = data.get('id')

        if not transaction_id:
            return JsonResponse({"success": False, "error": "No ID provided"}, status=400)

        tObject = Transactions.objects.get(id = transaction_id)
        tObject.delete()
        return JsonResponse({"success": True, "id": transaction_id})

def investments_view(request):
    return render(request, 'core/investments.html')
        