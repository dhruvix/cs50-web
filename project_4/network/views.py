from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.core.paginator import Paginator
from django.db.models import Count, Exists, OuterRef
from django.db import IntegrityError
from django.http import HttpResponse, HttpResponseRedirect
from django.http import JsonResponse
from django.shortcuts import render
from django.urls import reverse
import json

from .models import *

def index(request):
    print("logged in user is: ",request.user.id)
    return render(request, "network/index.html")

@login_required
def following(request):
    print("logged in user is: ",request.user.id)
    return render(request, "network/following.html")

def login_view(request):
    if request.method == "POST":

        # Attempt to sign user in
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)

        # Check if authentication successful
        if user is not None:
            login(request, user)
            return HttpResponseRedirect(reverse("index"))
        else:
            return render(request, "network/login.html", {
                "message": "Invalid username and/or password."
            })
    else:
        return render(request, "network/login.html")

def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("index"))

def register(request):
    if request.method == "POST":
        username = request.POST["username"]
        email = request.POST["email"]

        # Ensure password matches confirmation
        password = request.POST["password"]
        confirmation = request.POST["confirmation"]
        if password != confirmation:
            return render(request, "network/register.html", {
                "message": "Passwords must match."
            })

        # Attempt to create new user
        try:
            user = User.objects.create_user(username, email, password)
            user.save()
        except IntegrityError:
            return render(request, "network/register.html", {
                "message": "Username already taken."
            })
        login(request, user)
        return HttpResponseRedirect(reverse("index"))
    else:
        return render(request, "network/register.html")

@login_required
def compose(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST request required."}, status=400)

    data = json.loads(request.body)
    text = data.get('text')
    if text == "":
        return JsonResponse({"error": "Textfield can't be empty"}, status=400)
    
    p = Post(
        user = request.user,
        text = text
    )
    p.save()

    return JsonResponse({"message": "Post created successfully."}, status=201)

def serialize_post(item):
        return {
            "id": item.id,
            "user": item.user.username,
            "user_id": item.user.id,
            "user_liked": item.user_liked,
            "text": item.text,
            "likes": item.likes,
            "timestamp": item.timestamp.strftime("%b %d %Y, %I:%M %p"),
            "comments": [serialize_comment(c) for c in item.comment_set.order_by("-timestamp").all()]
        }

def serialize_comment(item):
    return {
        "id": item.id,
        "user_id": item.user.id,
        "user": item.user.username,
        "text": item.text,
        "timestamp": item.timestamp.strftime("%b %d %Y, %I:%M %p")
    }

def get_posts(request, label, page_number):

    user_like = Like.objects.filter(
        post = OuterRef('pk'),
        user_id = request.user.id if request.user else 0,
    )

    if label == "all":
        ps = Post.objects.prefetch_related('like_set').annotate(likes = Count('like')).annotate(user_liked = Exists(user_like)).order_by("-timestamp").all()
    elif label == "following":
        ps = Post.objects.filter(user__in = request.user.following.all()).prefetch_related('like_set').annotate(likes = Count('like')).annotate(user_liked = Exists(user_like)).order_by("-timestamp").all()
    else:
        return JsonResponse({"error":"Not a valid URL"}, safe=False)
    
    p_obj = Paginator(ps, 10)
    if page_number>p_obj.num_pages or page_number<=0:
        return JsonResponse({
            "error":r'Page {0} does not exist'.format(page_number),
            "posts": [],
            "logged_in": request.user.id,
            "current_page": page_number,
            "last_page": p_obj.num_pages
        }, safe=False)
    page = p_obj.page(page_number)
    
    return JsonResponse({
            "posts": [serialize_post(p) for p in page],
            "logged_in": request.user.id,
            "current_page": page_number,
            "last_page": p_obj.num_pages
        }, safe=False)

def get_user_posts(request, id, page_number):
    user_like = Like.objects.filter(
        post = OuterRef('pk'),
        user_id = request.user.id if request.user else 0,
    )
    ps = Post.objects.filter(user_id=id).prefetch_related('like_set').annotate(likes = Count('like')).annotate(user_liked = Exists(user_like)).order_by("-timestamp").all()
    p_obj = Paginator(ps, 10)
    if page_number>p_obj.num_pages or page_number<=0:
        return JsonResponse({
            "error":r'Page {0} does not exist'.format(page_number),
            "posts": [],
            "logged_in": request.user.id,
            "current_page": page_number,
            "last_page": p_obj.num_pages
        }, safe=False)
    page = p_obj.page(page_number)
    return JsonResponse({
        "posts": [serialize_post(p) for p in page],
        "logged_in": request.user.id,
        "current_page": page_number,
        "last_page": p_obj.num_pages
    }, safe=False)
    

@login_required
def handle_like(request, id):
    if request.method != "PUT":
        return JsonResponse({"error": "PUT request required."}, status=400)
    
    l = Like.objects.filter(
        post_id = id,
        user_id = request.user.id,
    ).first()
    message = ""
    if l:
        l.delete()
        message = "Like removed"
    else:
        l = Like(user = request.user, post_id = id)
        l.save()
        message = "Like saved"
    return JsonResponse({
            "message":message
        }, safe=False)

def profile(request, id):
    def serialize(item):
        f = False
        if request.user.is_authenticated:
            f = item in request.user.following.all()
        if item:
            return {
                "id": item.id,
                "username": item.username,
                "email": item.email,
                "followers": item.followed_by.count(),
                "follow": item.following.count(),
                "logged_in": request.user.id if request.user else 0,
                "following?": f
            }
        else:
            return {}
    u = User.objects.filter(pk=id).first()
    return render(request, "network/profile.html",{
        "user_data":serialize(u)
    })

@login_required
def handle_follow(request, id):
    if request.method != "PUT":
        return JsonResponse({"error": "PUT request required."}, status=400)
    
    if id == request.user.id:
        return JsonResponse({"error": "You cannot follow/unfollow yourself!"}, status=403)
    
    u = User.objects.filter(pk=id).first()
    if u:
        if u in request.user.following.all():
            request.user.following.remove(u)
            return JsonResponse({"message": r'user with id {0} unfollowed'.format(id)}, status=200)
        else:
            request.user.following.add(u)
            return JsonResponse({"message": r'user with id {0} followed'.format(id)}, status=200)
    else:
        return JsonResponse({"error": r'user with id {0} does not exist'.format(id)}, status=404)

@login_required
def handle_post(request, id):
    p = Post.objects.filter(pk=id).first()
    if p==None:
        return JsonResponse({"error": r'Post with id {0} does not exist'}, status=404)
    if p.user_id != request.user.id:
        return JsonResponse({"error": "You cannot edit or delete a post you haven't written"}, status=403)
    
    # edit post
    if request.method == "PUT":
        data = json.loads(request.body)
        text = data.get('text')
        if text == "":
            return JsonResponse({"error": "Textfield can't be empty"}, status=400)
        else:
            p.text = text
            p.save()
            return JsonResponse({"message": r'Post with id {0} has been editted'.format(id)}, status=200)  

    # delete post 
    if request.method == "DELETE":
        p.delete()
        return JsonResponse({"message": r'Post with id {0} has been deleted'.format(id)}, status=200) 

    else:
        return JsonResponse({"error": "PUT or DELETE request required."}, status=400)
    
@login_required
def post_comment(request):
    if request.method != "POST":
        return JsonResponse({"error": "PUT request required."}, status=400)
    
    data = json.loads(request.body)
    text = data.get('text')
    if text == "":
        return JsonResponse({"error": "Textfield can't be empty"}, status=400)
    
    c = Comment(user=request.user, post_id=data.get('post_id'), text=text)
    c.save()
    return JsonResponse({
        "message": r'Comment added to post with id {0}'.format(id),
        "new_comment": {
            "user": c.user.username,
            "user_id": c.user.id,
            "timestamp": c.timestamp.strftime("%b %d %Y, %I:%M %p"),
            "text": c.text
            }
        }, status=200)
