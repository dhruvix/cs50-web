document.addEventListener('DOMContentLoaded', function () {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archived'));
  document.querySelector('#compose').addEventListener('click', () => compose_email('', '', ''));

  // By default, load the inbox
  load_mailbox('inbox');

  // Selectors for POST/PUT requests
  document.getElementById('compose-form').addEventListener('submit', compose_submit);
});

function compose_email(recs, sub, body) {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#single-email-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelectorAll('.btn-sm').forEach(btn => btn.classList.remove("active"));
  document.querySelector('#compose').classList.add("active");

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = recs;
  document.querySelector('#compose-subject').value = sub;
  document.querySelector('#compose-body').value = body;
}

function load_mailbox(mailbox) {

  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#single-email-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelectorAll('.btn-sm').forEach(btn => btn.classList.remove("active"));
  document.querySelector(`#${mailbox}`).classList.add("active");

  // Show the mailbox name
  document.querySelector('.email-heading').innerHTML = `${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}`;

  fetch(`/emails/${mailbox}`)
    .then(response => response.json())
    .then(emails => {
      let elist = document.querySelector('.list-group');
      if(emails.length>0){
      elist.innerHTML = '';
      emails.forEach(email => {
        let ebox = document.createElement('div');
        ebox.style.cursor = 'pointer';
        ebox.addEventListener('click', () => show_email(email.id, mailbox));
        let col = email.read?'list-group-item-secondary':'';
        ebox.className = `list-group-item list-group-item-action flex-column align-items-start ${col}`;
        ebox.style.overflow = "clip";
        ebox.innerHTML = `<div class="d-flex w-100 justify-content-between" style="overflow:clip;">
                            <h6 class="mb-1">${email.sender}</h6>
                            <small>${email.timestamp}</small>
                          </div>
                          <p class="mb-1">${email.subject}</p>`;
        elist.appendChild(ebox);
      });
      }
      else{
        elist.innerHTML = `<div class="alert alert-warning alert-dismissible fade show" role="alert">
                               You have no <strong>${mailbox}</strong> emails.
                              <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                                <span aria-hidden="true">&times;</span>
                              </button>
                            </div>`;
      }
    });
}

function compose_submit(event) {
  event.preventDefault();
  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
      recipients: document.querySelector('input[name="recipients"]').value,
      subject: document.querySelector('input[name="subject"]').value,
      body: document.querySelector('#compose-body').value
    })
  })
    .then(response => {
      if (response.status === 201) {
        response.json().then(data => {
          load_mailbox('sent');
          make_alert(data.message, 'alert-success');
        });
      }
      else {
        make_alert('<strong>Error!</strong> Make sure you have at least one recipient and that all the recipients are valid.', 'alert-danger');
      }
    });
}

function make_alert(message, color) {
  let alert = document.querySelector('.alert');
  alert.innerHTML = `<div class="alert ${color} alert-dismissible fade show" role="alert">
                        ${message}
                        <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                          <span aria-hidden="true">&times;</span>
                        </button>
                      </div>`;
}

function show_email(email_id, mailbox) {
  fetch(`/emails/${email_id}`, {
    method: 'PUT',
    body: JSON.stringify({
        read: true
    })
  }).then(response => console.log(response));

  fetch(`/emails/${email_id}`)
  .then(response => response.json())
  .then(email => {
      document.querySelector('#emails-view').style.display = 'none';
      document.querySelector('#single-email-view').style.display = 'block';
      document.querySelector('#compose-view').style.display = 'none';
      document.querySelectorAll('.btn-sm').forEach(btn => btn.classList.remove("active"));
      document.getElementById('email-subject').innerHTML = email.subject;
      document.getElementById('email-sender').innerHTML = `Sender: ${email.sender}`;
      document.getElementById('email-timestamp').innerHTML = email.timestamp;
      document.getElementById('email-recipients').innerHTML = `Recipients: ${email.recipients}`;
      document.getElementById('email-body').innerHTML = email.body;
      let eb = document.getElementById('email-buttons');
      eb.innerHTML = '';
      let rb = document.createElement('button');
      let ab = document.createElement('button');
      rb.className = "btn btn-primary mr-1";
      ab.className = "btn btn-secondary";
      rb.innerHTML = "Reply";
      rb.addEventListener('click', () => email_reply(email.id));
      eb.appendChild(rb);
      if(mailbox==='inbox'){
        ab.innerHTML = "Archive";
        ab.addEventListener('click', () => archive_mail(email.id));
        eb.appendChild(ab);
      }
      else if(mailbox==='archived'){
        ab.innerHTML = "Unarchive";
        ab.addEventListener('click', () => unarchive_mail(email.id));
        eb.appendChild(ab);
      }
  });
}

function archive_mail(email_id){
  fetch(`/emails/${email_id}`, {
    method: 'PUT',
    body: JSON.stringify({
        archived: true
    })
  }).then(response => {
    load_mailbox('inbox');
  });
}

function unarchive_mail(email_id){
  fetch(`/emails/${email_id}`, {
    method: 'PUT',
    body: JSON.stringify({
        archived: false
    })
  }).then(response => {
    load_mailbox('inbox');
  });
}

function email_reply(email_id){
  fetch(`/emails/${email_id}`)
  .then(response => response.json())
  .then(email => {
      let rec = email.sender;
      let sub = email.subject;
      if(!sub.startsWith("Re: ")){
        sub = "Re: " + sub;
      }
      let bod = `\nOn ${email.timestamp} ${email.sender} wrote: ${email.body}`;
      compose_email(rec, sub, bod);
  });
}