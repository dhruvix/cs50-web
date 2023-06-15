from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import RegexValidator
# Create your models here.

class User(AbstractUser):
    pass

class Event(models.Model):
    WEDDING = "WEDD"
    BIRTHDAY = "BIRT"
    OFFICE = "OFFI"
    GRADUATION = "GRAD"
    DIWALI = "DIWA"
    CHRISTMAS = "CHRI"
    OTHER = "OTHE"
    event_type_choices = [
        (WEDDING, "Wedding"), (BIRTHDAY, "Birthday party"), (OFFICE, "Office party"), (GRADUATION, "Graduation"), (DIWALI, "Diwali celebration"), (CHRISTMAS, "Christmas party"), (OTHER, "Other")
    ]

    google_maps_regex = RegexValidator(
        regex=r'^https://www.google.com/maps/place/|^https://goo.gl/maps/',  # Validates that a link is a google maps link
        message="Enter a valid google maps location"
    )

    user = models.ForeignKey("User", on_delete=models.CASCADE)
    title = models.CharField(max_length=64)
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    location = models.CharField(validators=[google_maps_regex], max_length=256, blank=True, null=True)
    thumbnail = models.ImageField(upload_to='images/events', null=True, blank=True)
    type = models.CharField(max_length=4, choices=event_type_choices, default=OTHER)

    def num_cards(self):
        return EventCard.objects.filter(event_id=self.id).count()
    
    def serialize(self):
        return {
            "id": self.id,
            "type": self.type,
            "host": self.user.get_full_name(),
            "title": self.title,
            "thumbnail": str(self.thumbnail),
            "start_date": self.start_date.strftime("%b %d %Y, %I:%M %p"),
            "end_date": self.end_date.strftime("%b %d %Y, %I:%M %p"),
            "location": self.location
        }

class EventCard(models.Model):
    only_text_val = "T"
    image_text_val = "IT"
    text_image_val = "TI"
    only_image_val = "I"
    card_choices = [(only_text_val, "Text only card"), (image_text_val, "Image & Text card"), (text_image_val, "Text & Image card"), (only_image_val, "Image only card")]
    
    event = models.ForeignKey("Event", on_delete=models.CASCADE)
    position = models.SmallIntegerField()
    text = models.TextField(null=True, blank=True)
    image = models.ImageField(upload_to='images/events', null=True, blank=True)
    card_type = models.CharField(max_length=2, choices=card_choices, default=text_image_val)

    def serialize(self):
        return {
            "id": self.id,
            "type": self.card_type,
            "position": self.position,
            "text": self.text,
            "image": str(self.image)
        }
    
    class Meta:
        unique_together = ('event', 'position',)

class Invite(models.Model):
    pending_val = "P"
    accepted_val = "A"
    declined_val = "D"
    invitation_choices = [(pending_val, "Pending"), (accepted_val, "Accepted"), (declined_val, "Declined")]

    event = models.ForeignKey("Event", on_delete=models.CASCADE)
    invitee = models.ForeignKey("User", on_delete=models.CASCADE)
    status = models.CharField(max_length=1, choices=invitation_choices, default=pending_val)

    class Meta:
        unique_together = ('event', 'invitee',)