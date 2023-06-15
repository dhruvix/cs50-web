from django.contrib import admin
from django.db.models.aggregates import Count
from django.utils.html import format_html
from django.utils.http import urlencode
from django.urls import reverse
from .models import *

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ['email', 'name', 'events']

    # Display name in admin site
    @admin.display(ordering='name')
    def name(self, user):
        return user.first_name + " " + user.last_name
    
    # Display count of events user has hosted/ is hosting
    @admin.display()
    def events(self, user):
        url = reverse('admin:events_event_changelist') + "?" + urlencode({'user__id':str(user.id)})
        return format_html('<a href="{}">{}</a>',url, user.events_count)
    
    # Add events_count field to use in the admin site
    def get_queryset(self, request):
        return super().get_queryset(request).annotate(events_count = Count('event'))
  
class EventInviteInline(admin.TabularInline):
    model = Invite
    extra = 1
    # readonly_fields = ['status']

class EventCardInline(admin.TabularInline):
    model = EventCard
    extra = 0
    ordering = ['position']
    # readonly_fields = ['position']

@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ['title', 'user', 'start_date', 'end_date']
    #EventCard and Invite models are both visible in the Event model section
    inlines = [EventCardInline,EventInviteInline]