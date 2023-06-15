from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.db import IntegrityError
from django.db.models.aggregates import Max, Count
from django.http import HttpResponse, HttpResponseRedirect
from django.shortcuts import render
from django.urls import reverse

from .models import *


def index(request):
    active_listings = Listing.objects.filter(active=True).prefetch_related('bid_set').annotate(price=Max('bid__amount')).all()
    return render(request, "auctions/index.html",{
        "message":"Active Listings",
        "listings":active_listings,
            "empty_message":"No active listings at the moment"
    })


def listing(request, id):
    listing = Listing.objects.filter(id=id).first()
    if listing:
        comments = Comment.objects.filter(listing_id = id).all()
        bids = Bid.objects.filter(listing_id = id).order_by('-amount')
        highest_bid = bids.first()
        watchlist = False
        if request.user.is_authenticated and listing in request.user.watchlist.all():
            watchlist = True
        return render(request, "auctions/listing.html",{
            "listing":listing,
            "comments":comments,
            "bid_price":highest_bid,
            "bids":len(bids)-1,
            "watchlist":watchlist
        })
    else:
        return HttpResponseRedirect(reverse("index"))

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
            return render(request, "auctions/login.html", {
                "message": "Invalid username and/or password."
            })
    else:
        return render(request, "auctions/login.html")


def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("index"))


def register(request):
    if request.method == "POST":
        username = request.POST["username"]
        email = request.POST["email"]
        first_name = request.POST["first_name"]
        last_name = request.POST["last_name"]

        # Ensure password matches confirmation
        password = request.POST["password"]
        confirmation = request.POST["confirmation"]
        if password != confirmation:
            return render(request, "auctions/register.html", {
                "message": "Passwords must match."
            })

        # Attempt to create new user
        try:
            user = User.objects.create_user(username, email, password, first_name=first_name, last_name=last_name)
            user.save()
        except IntegrityError:
            return render(request, "auctions/register.html", {
                "message": "Username already taken."
            })
        login(request, user)
        return HttpResponseRedirect(reverse("index"))
    else:
        return render(request, "auctions/register.html")


@login_required
def comment(request):
    if request.method=="POST":
        listing_id = request.POST["listing_id"]
        comment = request.POST["comment"]
        try:
            c = Comment(user_id = request.user.id, listing_id = listing_id, comment = comment)
            c.save()
        except:
            return HttpResponse('Error saving comment')
        return HttpResponseRedirect(reverse("listing", args=(listing_id,)))


@login_required
def bid(request):
    if request.method=="POST":
        listing_id = request.POST["listing_id"]
        amount = request.POST["amount"]
        try:
            b = Bid(user_id = request.user.id, listing_id = listing_id, amount = amount)
            b.save()
        except:
            return HttpResponse('Error in saving bid')
        return HttpResponseRedirect(reverse("listing", args=(listing_id,)))


@login_required
def create(request):
    if request.method=="POST":
        title = request.POST["title"]
        description = request.POST["description"]
        image_url = request.POST["image_url"]
        category_id = request.POST["category"]
        amount = request.POST["amount"]
        try:
            l = Listing(title = title, description = description, image_url = image_url, category_id = category_id, starting_bid = amount, active = True, owner_id = request.user.id)
            l.save()
            b = Bid(user_id = request.user.id, listing_id = l.id, amount = amount)
            b.save()
        except:
            return HttpResponse('Error in saving listing')
        return HttpResponseRedirect(reverse("listing", args=(l.id,)))
    elif request.method=="GET":
        categories = Category.objects.all()
        return render(request, "auctions/create.html", {
            "categories": categories
        })


@login_required
def close(request):
    if request.method == "POST":
        listing_id = request.POST["listing"]
        l = Listing.objects.get(id=listing_id)
        if l.owner != request.user:
            return HttpResponse('Only the owner can close a listing')
        b = Bid.objects.filter(listing_id = listing_id).order_by('-amount').first()
        l.winner_id = b.user.id
        l.active = False
        l.save()
        return HttpResponseRedirect(reverse("index"))

@login_required
def watchlist(request):
    wl = request.user.watchlist.all()
    if request.method == "POST":
        listing_id = request.POST["listing"]
        l = Listing.objects.get(id = listing_id)
        if l in wl:
            request.user.watchlist.remove(l)
        else:
            request.user.watchlist.add(l)
        return HttpResponseRedirect(reverse("listing", args=(l.id,)))
    else:
        return render(request, "auctions/index.html", {
            "message":"Your watchlist",
            "listings":wl,
            "empty_message":"No listings in your watchlist"
        })


def categories(request):
    c = Category.objects.prefetch_related('listing_set').annotate(count = Count('listing'))
    return render(request, "auctions/categories.html", {
        "categories": c
    })


def category(request, id):
    category = Category.objects.filter(id=id).first()
    if category:
        listings = Listing.objects.filter(category_id=id).prefetch_related('bid_set').annotate(price=Max('bid__amount')).all()
        return render(request, "auctions/index.html",{
            "message":category.name,
            "listings":listings,
            "empty_message":"No listings in this category"
        })
    else:
        return HttpResponseRedirect(reverse("categories"))