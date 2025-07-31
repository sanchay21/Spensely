from django.shortcuts import render, redirect, HttpResponse
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login

# Create your views here.
def signup(request):
    if(request.method == "POST"):
        username = request.POST.get('username')
        password = request.POST.get('password')
        email = request.POST.get('email')
        first_name = request.POST.get('first_name')
        last_name = request.POST.get('last_name')

        user_check = User.objects.filter(username = username)

        if(user_check.exists()):
            print(f"Username {username} Already Taken")
            return redirect('signup')

        user = User.objects.create(
            username = username,
            email = email,
            first_name = first_name,
            last_name = last_name
        )
        user.set_password(password)
        user.save()
        print(f"Account created for {username}")

        return redirect('home')

    return render(request, 'authentication/signup.html')

def login_view(request):
    if(request.method == "POST"):
        username = request.POST.get('username')
        password = request.POST.get('password')

        check_user = User.objects.filter(username = username)

        if (not check_user.exists()):
            print("User Does Not Exists")
            return redirect('login')

        login_user = authenticate(username = username, password = password)

        if (not login_user):
            print("Incorrect Password")
            return redirect('login')

        login(request, login_user)
        print("Login Success")

        return redirect('home')
    return render(request, 'authentication/login.html')

        
            

def home(request):
    return render(request, 'authentication/home.html')
        