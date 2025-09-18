from django.shortcuts import render, HttpResponse, redirect
from .models import Transactions, Investments, Reminder
from django.http import JsonResponse
from .utils import get_crypto_price, calculate_investment_details
from django.db.models import Sum, Q
from django.utils import timezone
from datetime import datetime, timedelta
import json
import google.generativeai as genai
from django.conf import settings
import calendar

# Create your views here.
def index(request):
    return HttpResponse("Hello Wolrd!!")

def dashboard_view(request):
    # Get current month data
    current_month = timezone.now().month
    current_year = timezone.now().year
    
    # Calculate monthly income and expenses
    monthly_income = Transactions.objects.filter(
        user=request.user,
        category='Income',
        date__month=current_month,
        date__year=current_year
    ).aggregate(total=Sum('amount'))['total'] or 0
    
    monthly_expenses = Transactions.objects.filter(
        user=request.user,
        category='Expense',
        date__month=current_month,
        date__year=current_year
    ).aggregate(total=Sum('amount'))['total'] or 0
    
    # Get recent reminders
    reminders = Reminder.objects.filter(
        user=request.user,
        done=False
    ).order_by('due_date')[:5]
    
    # Get spending trends data for the last 12 months
    spending_data = []
    months_data = []
    
    for i in range(12):
        month_date = timezone.now() - timedelta(days=30*i)
        month_expenses = Transactions.objects.filter(
            user=request.user,
            category='Expense',
            date__month=month_date.month,
            date__year=month_date.year
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        spending_data.append(float(month_expenses))
        months_data.append(calendar.month_abbr[month_date.month])
    
    # Reverse to show chronological order
    spending_data.reverse()
    months_data.reverse()
    
    # Calculate balance
    balance = monthly_income - monthly_expenses
    
    context = {
        'monthly_income': monthly_income,
        'monthly_expenses': monthly_expenses,
        'balance': balance,
        'reminders': reminders,
        'spending_data': spending_data,
        'months_data': months_data,
    }
    
    return render(request, 'core/dashboard.html', context)
    
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

def investment_view(request):
    investments = Investments.objects.filter(user=request.user)
    details = [calculate_investment_details(inv) for inv in investments]

    total_invested = sum(inv.invested_amount for inv in investments)
    total_current = sum(d["current_value"] for d in details)
    total_returns = total_current - total_invested
    total_return_pct = (total_returns / total_invested * 100) if total_invested else 0

    context = {
        "investments": details,
        "total_invested": total_invested,
        "total_current": total_current,
        "total_returns": total_returns,
        "total_return_pct": round(total_return_pct, 2),
    }
    return render(request, "core/investments.html", context)

def get_chart_data(request):
    """API endpoint to get chart data for spending trends"""
    period = request.GET.get('period', 'monthly')  # 'monthly' or 'weekly'
    
    if period == 'weekly':
        # Get data for last 12 weeks
        data_points = []
        labels = []
        
        for i in range(12):
            end_date = timezone.now().date() - timedelta(weeks=i)
            start_date = end_date - timedelta(days=6)
            
            week_expenses = Transactions.objects.filter(
                user=request.user,
                category='Expense',
                date__range=[start_date, end_date]
            ).aggregate(total=Sum('amount'))['total'] or 0
            
            data_points.append(float(week_expenses))
            labels.append(f"Week {end_date.strftime('%m/%d')}")
        
        data_points.reverse()
        labels.reverse()
    
    else:  # monthly
        data_points = []
        labels = []
        
        for i in range(12):
            month_date = timezone.now() - timedelta(days=30*i)
            month_expenses = Transactions.objects.filter(
                user=request.user,
                category='Expense',
                date__month=month_date.month,
                date__year=month_date.year
            ).aggregate(total=Sum('amount'))['total'] or 0
            
            data_points.append(float(month_expenses))
            labels.append(calendar.month_abbr[month_date.month])
        
        data_points.reverse()
        labels.reverse()
    
    return JsonResponse({
        'labels': labels,
        'data': data_points,
        'period': period
    })

def get_ai_insights(request):
    """Generate AI insights using Gemini Pro API"""
    try:
        # Check if API key is configured
        api_key = getattr(settings, 'GOOGLE_API_KEY', '')
        if not api_key or api_key == 'your-api-key-here':
            return JsonResponse({
                'success': False,
                'error': 'Google Gemini API key is not configured. Please add your API key to settings.py',
                'details': 'GOOGLE_API_KEY is missing or not set'
            })
        
        # Configure Gemini AI
        genai.configure(api_key=api_key)
        
        # Get user's financial data
        current_month = timezone.now().month
        current_year = timezone.now().year
        
        monthly_income = Transactions.objects.filter(
            user=request.user,
            category='Income',
            date__month=current_month,
            date__year=current_year
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        monthly_expenses = Transactions.objects.filter(
            user=request.user,
            category='Expense',
            date__month=current_month,
            date__year=current_year
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        # Check if user has any financial data
        if monthly_income == 0 and monthly_expenses == 0:
            return JsonResponse({
                'success': True,
                'insights': '''• Start tracking your income and expenses to get personalized insights
• Add some transactions to see AI-powered financial recommendations
• Regular financial tracking helps identify spending patterns
• Set up automatic savings to build a healthy financial habit'''
            })
        
        # Get top spending categories
        recent_expenses = Transactions.objects.filter(
            user=request.user,
            category='Expense',
            date__month=current_month,
            date__year=current_year
        ).values('description').annotate(total=Sum('amount')).order_by('-total')[:5]
        
        # Create prompt for AI
        expenses_text = ', '.join([f"{exp['description']}: ₹{exp['total']}" for exp in recent_expenses]) if recent_expenses else 'No expenses recorded'
        savings_rate = ((monthly_income - monthly_expenses) / monthly_income * 100) if monthly_income > 0 else 0
        
        prompt = f"""Analyze this user's financial data and provide personalized advice:

Monthly Income: ₹{monthly_income}
Monthly Expenses: ₹{monthly_expenses}
Savings Rate: {savings_rate:.1f}%

Top Expense Categories: {expenses_text}

Provide 3-4 actionable financial tips in bullet points. Keep it concise and practical. Start each tip with a bullet point (•)."""
        
        print(f"AI Prompt: {prompt}")  # Debug log
        
        # Generate AI response
        # Use the current model name from Google AI Studio
        model = genai.GenerativeModel('gemini-2.0-flash')
        response = model.generate_content(prompt)
        
        if not response or not response.text:
            return JsonResponse({
                'success': False,
                'error': 'No response from AI service. Please try again.',
                'details': 'Empty response from Gemini API'
            })
        
        print(f"AI Response: {response.text}")  # Debug log
        
        return JsonResponse({
            'success': True,
            'insights': response.text
        })
    
    except Exception as e:
        print(f"AI Insights Error: {str(e)}")  # Debug log
        return JsonResponse({
            'success': False,
            'error': 'Unable to generate insights. Please check your API key and try again.',
            'details': str(e)
        })

def add_reminder(request):
    """Add a new reminder"""
    if request.method == 'POST':
        title = request.POST.get('title')
        due_date_str = request.POST.get('due_date')
        notes = request.POST.get('notes', '')
        
        if title:
            # Convert date string to date object if provided
            due_date = None
            if due_date_str and due_date_str.strip():
                try:
                    from datetime import datetime
                    due_date = datetime.strptime(due_date_str, '%Y-%m-%d').date()
                except ValueError:
                    return JsonResponse({'success': False, 'error': 'Invalid date format'})
            
            reminder = Reminder.objects.create(
                user=request.user,
                title=title,
                due_date=due_date,
                notes=notes
            )
            
            return JsonResponse({
                'success': True,
                'reminder': {
                    'id': reminder.id,
                    'title': reminder.title,
                    'due_date': reminder.due_date.strftime('%Y-%m-%d') if reminder.due_date else None,
                    'notes': reminder.notes
                }
            })
    
    return JsonResponse({'success': False, 'error': 'Invalid data'})

def toggle_reminder(request, reminder_id):
    """Toggle reminder completion status"""
    if request.method == 'POST':
        try:
            reminder = Reminder.objects.get(id=reminder_id, user=request.user)
            reminder.done = not reminder.done
            reminder.save()
            
            return JsonResponse({
                'success': True,
                'done': reminder.done
            })
        except Reminder.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'Reminder not found'})
    
    return JsonResponse({'success': False, 'error': 'Invalid request'})

def delete_reminder(request, reminder_id):
    """Delete a reminder"""
    if request.method == 'POST':
        try:
            reminder = Reminder.objects.get(id=reminder_id, user=request.user)
            reminder.delete()
            
            return JsonResponse({'success': True})
        except Reminder.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'Reminder not found'})
    
    return JsonResponse({'success': False, 'error': 'Invalid request'})
        