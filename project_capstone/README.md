# Capstone project - Kairos
<img src="/project_capstone/events/static/assets/Kairos-100.png" height="100px">

## What is Kairos?

Kairos is a website that allows users to create pages for various events, such as weddings or birthday parties and send out invitations. On receiving an invitation, a user can either accept or decline the invitation, which the user who sent the invitation can then see.

Click [here](https://youtu.be/fg_j_cn9Y3E) to see the video demo on youtube.

## Application features

1. <b>Create an event:</b> A user is able to create an Event object which contains basic information about the event such as the title, date and time, location, thumbnail etc. (The location and thumbnail are optional fields) If a user does not select a thumbnail, a default thumbnail will be chosen based on the type of event. 
2. <b>Edit an event page:</b> An individual event page is made up of many "Event cards" that contain information about the event. These cards are customizable and can contain text or an image or both. The user can change the position of the text and the image in each card.
3. <b>View events and invitations:</b> A user can view all the invitations that have been sent to them by toggling a sidebar component. The user can see the event page of any event they have been invited to before choosing to accept or decline the invitation.
4. <b>Manage invitations:</b> An event's host can view all the invitations they have sent out, along with the invitees' responses, conveniently in one place on the event page (This is visible only to the event's host). The host can also withdraw invitations after they have been sent out if they choose to. A user is not limited to inviting only other users who have an account in Kairos. They can invite someone who doesn't have an account and an account will automatically be created for the invitee. This new user will receive an email with a randomly generated password they can use to log in to Kairos.
5. <b>Change user password:</b> A user also has the ability to change their password or name once they've logged in.
6. <b>Page of user's events:</b> All users have access to a page which shows them all the events relevant to them in three separate groups. These are, events that they have created, upcoming events (events that they have accepted the invitation for that haven't taken place yet) and attended events.


Run the following commands from the main directory to make the migrations for the events app and run the application:
```
python manage.py makemigrations events
python manage.py migrate
python manage.py runserver
```
