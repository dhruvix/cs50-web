from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.core.paginator import Paginator
from django.core.mail import send_mail
from django.conf import settings
from django.db.models import Count, Exists, OuterRef, Max
from django.db import IntegrityError
from django.utils import timezone
from django.http import HttpResponseRedirect, JsonResponse
from django.shortcuts import render
from django.urls import reverse
from .models import *
import json
import string
import random

# HELPER FUNCTIONS

def serialize_invite(item):
        return {
            "id": item.id,
            "event": item.event_id,
            "event_name": item.event.title,
            "start_date": item.event.start_date.strftime("%b %d %Y, %I:%M %p"),
            "invitee_id": item.invitee_id,
            "invitee_email": item.invitee.email,
            "invitee_name": item.invitee.get_full_name(),
            "status": item.status,
            "location": item.event.location,
            "inviter": item.event.user.get_full_name()
        }

def get_event_types():
    event_types = []
    for et in Event.event_type_choices:
        event_types.append({"id":et[0][:4], "name":et[1]})
    return event_types

# VIEW FUNCTIONS

def index(request):
    print("logged in user is: ",request.user.id)
    return render(request, "events/index.html")

@login_required
def my_events_page(request):
    return render(request, "events/my_events.html")

@login_required
def invites_page(request):
    return render(request, "events/invites.html")

@login_required
def create_page(request):
    return render(request, "events/create.html",{
        "event_types":get_event_types()
    })

# Fetches all the data for an individual event
@login_required
def event_page(request, id):
    i = Invite.objects.filter(event_id=id, invitee_id=request.user.id).first()
    try:
        e = Event.objects.get(pk=id)
    except:
        context = {"allowed": False, "message": "This page does not exist"}
        return render(request, "events/event.html", context)

    # User should not see the event if he hasn't been invited
    if i==None:
        context = {"allowed": False, "message": "You cannot view this page"}
    if e.user_id ==request.user.id or i:
        ec = EventCard.objects.filter(event_id=id).order_by('position').all()
        context = {
            "allowed": True,
            "event_id": id,
            "inviter": e.user.first_name + " " + e.user.last_name,
            "inviter_id": e.user.id,
            "title": e.title,
            "start_date": e.start_date.strftime("%b %d %Y, %I:%M %p"),
            "end_date": e.end_date.strftime("%b %d %Y, %I:%M %p"),
            "location": e.location,
            "type": e.type,
            "num_cards": e.num_cards(),
            "cards": [c.serialize() for c in ec]
        }
    return render(request, "events/event.html", context)

@login_required
def edit_page(request, id):
    e = Event.objects.filter(pk=id).first()
    if e:
        # User should not be able to edit any other user's events            
        if e.user_id == request.user.id:
            ec = EventCard.objects.filter(event_id=id).order_by('position').all()
            context = {
                "allowed": True,
                "event_id": id,
                "title": e.title,
                "start_date": e.start_date.strftime("%Y-%m-%d %H:%M"),
                "end_date": e.end_date.strftime("%Y-%m-%d %H:%M"),
                "location": e.location,
                "thumbnail": str(e.thumbnail),
                "type": e.type,
                "event_types":get_event_types(),
                "num_cards": e.num_cards(),
                "cards": [c.serialize() for c in ec]
            }
        else:
            context = {"allowed": False, "message": "You cannot view this page"}
    else:
        context = {"allowed": False, "message": "This event does not exist"}
    return render(request, "events/edit.html", context)

def login_view(request):
    if request.method == "POST":

        # Attempt to sign user in
        email = request.POST["email"]
        password = request.POST["password"]
        user = authenticate(request, username=email, password=password)

        # Check if authentication successful
        if user is not None:
            login(request, user)
            return HttpResponseRedirect(reverse("index"))
        else:
            return render(request, "events/index.html", {
                "login_message": "Invalid email and/or password."
            })
    else:
        return render(request, "events/index.html")


def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("index"))


def register(request):
    if request.method == "POST":
        email = request.POST["email"]

        # Ensure password matches confirmation
        password = request.POST["password"]
        confirmation = request.POST["confirmation"]
        if password != confirmation:
            return render(request, "events/index.html", {
                "register_message": "Passwords must match."
            })

        # Attempt to create new user
        try:
            user = User.objects.create_user(email, email, password)
            user.first_name = request.POST["first_name"]
            user.last_name = request.POST["last_name"]
            user.save()
        except IntegrityError as e:
            print(e)
            return render(request, "events/index.html", {
                "register_message": "Email address already taken."
            })
        login(request, user)
        return HttpResponseRedirect(reverse("index"))
    else:
        return render(request, "events/index.html")
    
def change_password(request):
    data = json.loads(request.body)
    email = data.get("email")
    first_name = data.get("first_name")
    last_name = data.get("last_name")
    password = data.get("password")
    new_password = data.get("new_password")
    user = authenticate(username=email, password=password)
    if user is not None:
        u = User.objects.get(username=email)
        u.first_name = first_name
        u.last_name = last_name
        u.set_password(new_password)
        u.save()
        return JsonResponse({
            "message": "Changes saved"
        }, status=200)
    else:
        return JsonResponse({
            "message": "Incorrect password"
        }, status=400)
    
@login_required
def handle_invites(request):
    
    # returns all pending invites
    if request.method == "GET":
        invites = Invite.objects.select_related('event','invitee').filter(invitee_id=request.user.id, status=Invite.pending_val).all()
        return JsonResponse({
            "message": "Pending invites",
            "invites": [serialize_invite(i) for i in invites]
        }, status=200)
    
    # creating an invite
    elif request.method == "POST":
        data = json.loads(request.body)
        email = data.get("email")
        first_name = data.get("first_name")
        last_name = data.get("last_name")
        event_id = data.get("event_id")

        # make sure the event_id is valid
        e = Event.objects.filter(id=event_id).first()
        if e==None:
            return JsonResponse({
            "message": "Event object not found"
            }, status=404)

        # check if a user with the email exists
        u = User.objects.filter(email=email).first()

        # create invite with the email
        if u:
            if Invite.objects.filter(event_id = event_id, invitee_id = u.id).first():
                return JsonResponse({
                    "message": r'Invite already sent to {0}'.format(email)
                    }, status=403)
            inv = Invite(event_id = event_id, invitee_id = u.id, status = "P")
            inv.save()

        # otherwise, create a user object with a random password and send an email to the user with instructions
        else:
            rand_password = ''.join(random.choices(string.ascii_lowercase + string.digits, k=10))
            new_user = User.objects.create_user(email, email, rand_password)
            new_user.first_name = first_name
            new_user.last_name = last_name
            new_user.save()
            send_mail(
                r'Invitation for {0}'.format(e.title),
                r'Login to Kairos using this email and the password: "{0}". You can change the password once you login.'.format(rand_password),
                settings.EMAIL_HOST_USER,
                [email],
                fail_silently=False,
            )
            inv = Invite(event_id = event_id, invitee = new_user, status = "P")
            inv.save()

        return JsonResponse({
            "message": r'Invite sent to {0}'.format(email)
            }, status=200)

    # to change the status of an invite
    elif request.method == "PUT":
        data = json.loads(request.body)
        new_status = data.get("status")
        event_id = data.get("event_id")

        invite = Invite.objects.filter(event_id=event_id, invitee_id=request.user.id).first()
        if invite == None:
           return JsonResponse({
            "message": "Invite object not found"
            }, status=404)
        
        if new_status not in [Invite.pending_val, Invite.accepted_val, Invite.declined_val]:
            return JsonResponse({
            "message": "Invalid status"
            }, status=400)
        
        invite.status = new_status
        invite.save()
        return JsonResponse({
            "message": "Status updated"
            }, status=200)
    
    # to delete an invite with id
    elif request.method == "DELETE":
        data = json.loads(request.body)
        id = data.get("id")
        i = Invite.objects.filter(id=id).first()
        if i==None:
            return JsonResponse({
            "message": "Invite object not found"
            }, status=404)
        # notify the invitee via email
        send_mail(
                r'Invitation for {0} withdrawn'.format(i.event.title),
                "Sorry, you are no longer invited to this event.",
                settings.EMAIL_HOST_USER,
                [i.invitee.email],
                fail_silently=False,
            )
        i.delete()
        return JsonResponse({
            "message": "Invite object deleted"
            }, status=204)

    
@login_required
def get_all_invites(request, event_id):
    
    # check if the event exists
    e = Event.objects.filter(pk=event_id).first()
    if e == None:
        return JsonResponse({
            "message": "Event object not found"
            }, status=404)
    
    # make sure the event's owner is logged in
    if e.user_id != request.user.id:
        return JsonResponse({
            "message": "User not authorized to see these invites"
            }, status=403)
    
    invites = Invite.objects.filter(event_id=event_id).order_by('-id').all()
    return JsonResponse({
            "message": r'Invitations sent out for {0}'.format(e.title),
            "invites": [serialize_invite(i) for i in invites]
            }, status=200)


@login_required
def get_events(request, tag):
    
    # events hosted by logged in user
    if tag=="your":
        events = Event.objects.filter(user=request.user).order_by("-id")[:5]
    # events that have already ended
    elif tag=="attended":
        events = Event.objects.prefetch_related('invite_set').filter(invite__invitee=request.user, invite__status=Invite.accepted_val, end_date__lte=timezone.now()).order_by("-id")[:5]
    # events that have not yet finished
    elif tag=="upcoming":
        events = Event.objects.prefetch_related('invite_set').filter(invite__invitee=request.user, invite__status=Invite.accepted_val, end_date__gt=timezone.now()).order_by("-id")[:5]
    else:
        return JsonResponse({
            "message": "Invalid tag",
            }, status=404)
    
    return JsonResponse({
            "message": r'{0} events'.format(tag),
            "events": [e.serialize() for e in events]
            }, status=200)

@login_required
def handle_event(request, id):
    # The GET and DELETE requests will require the id of the event they pertain to. A POST request does not need this but a value of 0 is passed in here for convenience.
    # To edit an event, a POST request with an id is sent.
    if id!=0:
        e = Event.objects.filter(pk=id).first()
        if e == None:
            return JsonResponse({
                "message": "Event not found",
            }, status=404)
        if e.user.id != request.user.id:
            return JsonResponse({
                "message": "You cannot access this event through this function",
            }, status=403)
        
    # get event data along with event cards 
    if request.method == "GET":
        ec = EventCard.objects.filter(event_id=id).order_by('position').all()
        return JsonResponse({
                "message": r'Event {0}'.format(id),
                "event": e.serialize(),
                "num_cards": e.num_cards(),
                "cards": [c.serialize() for c in ec]
            }, status=200)
    
    elif request.method == "POST":
        # To create a new event
        if id==0:
            title = request.POST['title']
            start_date = request.POST['start']
            end_date = request.POST['end']
            location = request.POST['location']
            try:
                thumbnail = request.FILES['thumbnail']
            except:
                # No file chosen
                thumbnail = None
            e_type = request.POST['type']
            e = Event(title=title, start_date=start_date, end_date=end_date, location=location, thumbnail=thumbnail, type=e_type, user=request.user)
            try:
                e.save()
                return JsonResponse({
                        "message": "New event created"
                    }, status=200)
            except:
                return JsonResponse({
                        "message": "Couldn't create Event"
                    }, status=500)
        # To edit an existing event  
        else:
            e.title = request.POST['title']
            e.start_date = request.POST['start']
            e.end_date = request.POST['end']
            e.location = request.POST['location']
            e.type = request.POST['type']
            try:
                # new image file chosen
                thumbnail = request.FILES['thumbnail']
                e.thumbnail = thumbnail
            except:
                # No file chosen
                pass
            
            try:
                e.save()
                return JsonResponse({
                        "message": "Event saved"
                    }, status=200)
            except:
                return JsonResponse({
                        "message": "Couldn't save changes"
                    }, status=500)

    elif request.method == "DELETE":
        try:
            e.delete()
            return JsonResponse({
                "message": "Event object deleted"
                }, status=204)
        except:
            return JsonResponse({
                        "message": "Couldn't delete event"
                    }, status=500)
    
    else:
        return JsonResponse({
                "message": "Not a valid request"
            }, status=500)


@login_required
def handle_cards(request, id):

    if request.method == "GET":
        # fetch the appropriate event (id here is event_id)
        e = Event.objects.filter(pk=id).first()
        if e == None:
            return JsonResponse({
                "message": "Event not found",
            }, status=404)
        if e.user.id != request.user.id:
            return JsonResponse({
                "message": "You cannot access this event through this function",
            }, status=403)
        
        ec = EventCard.objects.filter(event_id=id).order_by('position').all()
        return JsonResponse({
                "message": r'Event {0}\'s cards'.format(id),
                "num_cards": e.num_cards(),
                "cards": [c.serialize() for c in ec]
            }, status=200)
    
    # This creates a blank event card
    elif request.method == "PUT":
        # Here id is the event_id
        # For now, position is one more than the greatest position
        pos = EventCard.objects.filter(event_id=id).aggregate(Max('position')).get('position__max')
        if pos==None:
            pos=1
        else:
            pos += 1
        
        ec = EventCard(event_id = id, position = pos)
        try:
            ec.save()
            return JsonResponse({
                    "message": "Event card created",
                    "card": ec.serialize()
                }, status=200)
        except:
            return JsonResponse({
                    "message": "Couldn't create card"
                }, status=500)
        
    # This is to delete an event card. Id here is the event card's id.
    elif request.method == "DELETE":
        ec = EventCard.objects.filter(pk=id).first()
        if ec == None:
            return JsonResponse({
                "message": "Event card not found",
            }, status=404)
        try:
            ec.delete()
            return JsonResponse({
                "message": "Event card object deleted"
                }, status=204)
        except:
            return JsonResponse({
                        "message": "Couldn't delete event card"
                    }, status=500)
        
    # This is to save changes made to an existing card
    elif request.method == "POST":
        # Here id is the id of the Event card.
        ec = EventCard.objects.filter(pk=id).first()
        if ec == None:
            return JsonResponse({
                "message": "Event card not found",
            }, status=404)
        
        ec.text = request.POST['text']
        ec.card_type = request.POST['type']
        try:
            # new image file chosen
            image = request.FILES['image']
            ec.image = image
        except:
            # No file chosen
            pass
        try:
            ec.save()
            return JsonResponse({
                "message": "Event card saved"
            }, status=200)
        except:
            return JsonResponse({
                "message": "Couldn't save changes"
            }, status=500)
    