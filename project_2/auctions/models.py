from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    watchlist = models.ManyToManyField("Listing", blank=True)

class Category(models.Model):
    name = models.CharField(max_length=128)
    def __str__(self) -> str:
        return self.name

class Listing(models.Model):
    title = models.CharField(max_length=128)
    description = models.TextField()
    image_url = models.CharField(max_length=448,null=True)
    category = models.ForeignKey(Category, on_delete=models.PROTECT, null=True)
    starting_bid = models.DecimalField(max_digits=5, decimal_places=2)
    active = models.BooleanField()
    owner = models.ForeignKey(User, on_delete=models.PROTECT, related_name="owned_listings")
    winner = models.ForeignKey(User, on_delete=models.SET_NULL, blank=True, null=True, related_name="listings_won")
    def __str__(self) -> str:
        return self.title

class Bid(models.Model):
    listing = models.ForeignKey(Listing, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=5, decimal_places=2)

class Comment(models.Model):
    listing = models.ForeignKey(Listing, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    comment = models.TextField()