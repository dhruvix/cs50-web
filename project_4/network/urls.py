
from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("login", views.login_view, name="login"),
    path("logout", views.logout_view, name="logout"),
    path("register", views.register, name="register"),
    path("profile/<int:id>", views.profile, name="profile"),
    path("following", views.following, name="following"),

    path("posts", views.compose, name="compose"),
    path("posts/<str:label>/<int:page_number>", views.get_posts, name="get_posts"),
    path("posts/user/<int:id>/<int:page_number>", views.get_user_posts, name="user_posts"),
    path("post/<int:id>", views.handle_post, name="edit_or_delete"),

    path("like/<int:id>", views.handle_like, name="like"),
    path("follow/<int:id>", views.handle_follow, name="follow"),
    path("comment", views.post_comment, name="post_comment")
]



# posts/id -> get post with id or edit post with id [GET,PUT]
# posts/user/user_id -> get posts by user [GET]
# like/id -> like/unlike post with id [PUT]