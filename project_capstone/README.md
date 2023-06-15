# CS50 Capstone project - Kairos
<img src="/events/static/assets/Kairos-100.png" height="100px">

## What is Kairos?

Kairos is a website that allows users to create pages for various events, such as weddings or birthday parties and send out invitations. On recieving an invitation, a user can either accept or decline the invitation, which the user who sent the invitation can then see.

## Application features

1. <b>Create an event:</b> A user is able to create an Event object which contains basic information about the event such as the title, date and time, location, thumbnail etc. (The location and thumbnail are optional fields) If a user does not select a thumbnail, a default thumbnail will be chosen based on the type of event. 
2. <b>Edit an event page:</b> An individual event page is made up of many "Event cards" that contain information about the event. These cards are customizable and can contain text or an image or both. The user can change the position of the text and the image in each card.
3. <b>View events and invitations:</b> A user can view all the invitations that have been sent to them by toggling a sidebar component. The user can see the event page of any event they have been invited for before choosing to accept or decline the invitation.
4. <b>Manage invitations:</b> An event's host can view all the invitations they have sent out, along with the invitees' responses, conveniently in one place in the event page (This is visible only to the event's host). The host can also withdraw invitations after they have been sent out, if they choose to. A user is not limited to inviting only other users who have an account in Kairos. They can invite someone who doesn't have an account and an account will automatically be created for the invitee. This new user will recieve an email with a randomly generated password they can use to log in to Kairos.
5. <b>Change user password:</b> A user also has the ability to change their password or name once they've logged in.
6. <b>Page of user's events:</b> All users have access to a page which shows them all the events relavant to them in three separate groups. These are, events that they have created, upcoming events (events that they have accepted the invitation for that haven't taken place yet) and attended events.

## Distinctiveness and Complexity

I believe that this model is distinct from `Mail` in the sense that this does not involve only the sending and receiving of text data between users. It is also distinct from `Wiki` since Kairos does so much more than just perform CRUD operations on text data. It is different from `Commerce` and `Network` since this application cannot be termed as an e-commerce application or a traditional social network. It is also very different from the old Pizza projcet since there is no single "menu" structure that all the users can access and that dictates user actions on the site.

I believe that this project meets the complexity requirements of the Capstone. Firstly, this project involves a lot of image files. Handling files in Django is more complex than handling text and I hadn't done this in any of the earlier projects. Lots of other parameters needed to be changed in Django's `settings.py` and `urls.py` files and a new folder `media` was created to store these files. There is also an image preview aspect that is more complicated than previewing just text. Secondly, in this project I also worked with Django's email package, something that required some amount of setting up. Emails are sent to users when Accounts are created for them (as described above) and when invitations are withdrawn from them. In conjunction with this, there is also a "change password" functionality adds another layer of complexity. Finally, Kairos has a lot of moving parts that interact with each other. Events can be created, that have many event cards and invitations attached to them. These in turn also have various functions associated with them that adds to the overall complexity.

## Django models

This application has 4 different models:

1. `User:` This contains objects for all the users who have accounts in Kairos. The fields it contains are username, email, first_name, last_name and password.
2. `Event:` This contains objects for all the Events. The fields it contains are title, thumbnail, start_date, end_date, location, event type and `User`.
3. `EventCard:` An event card object contains information about a card in an event page. The fields it contains are image, text, card_type, position and `Event`.
4. `Invite:` An invite object has the following fields: `Event`, `User` (called invitee) and status. The status can be either Accepted, Rejected or Pending.

## What some of the important files contain

This project has only one newly created app called `events`. All the folders and files listed in the table below belong to that app.

| Parent folder | File name | Details |
|---------------|-----------|---------|
| `templates/events` | `layout.html` | This contains the code for the navbar and the sidebar to view invitations that is visible accross all pages, as well as the logic to change user account details. |
| `templates/events` | `index.html` | This page displays a login and a registration form when the user hasn't signed in and a home page when the user has logged in. |
| `templates/events` | `create.html` | This page contains a form that can be used to create an event. It is accessible when the user has logged in. |
| `templates/events` | `event.html` | This is an event page. It displays the details pertaining to an event. An event's event page is visible only to the event's creator and the invitees. The event's creator also has access to an invitations dashboard where they can manage their invitations. |
| `templates/events` | `edit.html` | This is the page that allows you to edit details about an event and also add, delete and edit event cards. This is available only to the event's creator. |
| `templates/events` | `my_events.html` | This page shows a user all the events relavant to them as described above. |
| `static/events` | `create.js` | Contains functions related to creating a new event. |
| `static/events` | `edit.js` | This handles all the functions that are involved with editting or deleting an Event as well as creating, editting and deleting event cards. |
| `static/events` | `event.js` | This contains code to populate an event page. |
| `static/events` | `index.js` | This contains the form validation logic for the login and register forms. |
| `static/events` | `invites.js` | This file contains the code to populate the invitations sidebar, as well as the functions to respond to the invites. |
| `static/events` | `my_events.js` | This contains the logic to populate the "my events" page. |
| `events` | `urls.py` | Contains the urls of the API endpoints defined in `views.py`. |

## Running the application

Run the following commands from the main directory to make the migrations for the events app and run the application:
```
python manage.py makemigrations events
python manage.py migrate
python manage.py runserver
```