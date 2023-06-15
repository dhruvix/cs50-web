from django.urls import path
from . import views

urlpatterns = [
    #pages
    path("", views.index, name="index"),
    path("events", views.my_events_page, name="my_events_page"),
    path("events/<int:id>", views.event_page, name="event_page"),
    path("create", views.create_page, name="create_page"),
    path("edit/<int:id>", views.edit_page, name="edit_page"),

    #authentication
    path("login", views.login_view, name="login"),
    path("logout", views.logout_view, name="logout"),
    path("register", views.register, name="register"),
    path("change_password", views.change_password, name="change_password"),

    #other API endpoints
    path("handle_invites", views.handle_invites, name="handle_invites"),
    path("invites/<int:event_id>", views.get_all_invites, name="invites"),
    path("events/<str:tag>", views.get_events, name="events"),
    path("event/<int:id>", views.handle_event, name="handle_event"),
    path("cards/<int:id>", views.handle_cards, name="handle_event_cards"),
]