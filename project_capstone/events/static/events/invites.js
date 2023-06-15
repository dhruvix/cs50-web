document.addEventListener('DOMContentLoaded', function () {
    // this populates the invitations sidebar compaonent
    get_invites();
});

//get all the invites of the logged_in user
function get_invites(){
    const request = new Request(
        "/handle_invites",
        { headers: { 'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value } }
    );
    fetch(request).then(response => response.json())
    .then(res => {
        //change the value of the main-invites div only if there are invites pending
        let main_invites_card = document.getElementById("main-invites");
        if(res.invites.length > 0){
            main_invites_card.innerHTML="";
        }
        //create a card for each invite
        res.invites.forEach(invite => {
            let invite_card = document.createElement("div");
            invite_card.className = "card border-warning mb-3 invite-card";
            invite_card.id = `invite-event-${invite.event}`;
            let card_body = document.createElement("div");
            card_body.className = "card-body";
            card_body.innerHTML = `<h5 class="card-title">${invite.event_name}</h5>
                                    <h6 class="card-subtitle mb-2 text-muted">from ${invite.inviter}</h6>
                                    <p>Starting: ${invite.start_date}</p>`;
            invite_card.append(card_body);
            let card_footer = document.createElement("div");
            card_footer.className = "card-footer d-flex justify-content-between p-1";
            let button_block = document.createElement("div");
            button_block.className = "btn-group";
            let accept_button = document.createElement("button");
            let decline_button = document.createElement("button");
            accept_button.className = "btn btn-outline-success";
            accept_button.id = `accept-${invite.event}`;
            decline_button.className = "btn btn-outline-danger";
            decline_button.id = `decline-${invite.event}`;
            accept_button.innerHTML = `Accept <i class="bi bi-hand-thumbs-up-fill"></i>`;
            decline_button.innerHTML = `<i class="bi bi-hand-thumbs-down-fill"></i> Decline`;
            button_block.append(accept_button);
            button_block.append(decline_button);
            card_footer.append(button_block);
            if(invite.location){
                card_footer.innerHTML += `<a class="btn btn-dark" href="${invite.location}" target="_blank" rel="noopener noreferrer"><i class="bi bi-geo-alt-fill"></i> Location</a>`;
            }
            invite_card.append(card_footer);
            main_invites_card.append(invite_card);

            //clicking on the card should take you to the events page
            card_body.style.cursor = "pointer";
            card_body.addEventListener('click', ()=>{window.location.href = `/events/${invite.event}`;})
            //accepting and declining functionalities
            document.getElementById(`accept-${invite.event}`).addEventListener('click', ()=>respond(invite.event, "A"));
            document.getElementById(`decline-${invite.event}`).addEventListener('click', ()=>respond(invite.event, "D"));
        });
    });
}

function respond(event_id, resp){
    const accept = document.getElementById(`accept-${event_id}`);
    const decline = document.getElementById(`decline-${event_id}`);
    const request = new Request(
        "/handle_invites",
        { headers: { 'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value } }
    );
    fetch(request, {
        method: 'PUT',
        body: JSON.stringify({
            status: resp,
            event_id: event_id
        })
      }).then(response => {
        if(response.status === 200){
            if(resp=="A"){
                console.log("Accepted");
                accept.classList.remove('btn-outline-success');
                accept.classList.add('btn-success');
                if(decline.className.includes('btn-danger')){
                    decline.classList.remove('btn-danger');
                    decline.classList.add('btn-outline-danger');
                }
            }
            else if(resp=="D"){
                console.log("Declined");
                decline.classList.remove('btn-outline-danger');
                decline.classList.add('btn-danger');
                if(accept.className.includes('btn-success')){
                    accept.classList.remove('btn-success');
                    accept.classList.add('btn-outline-success');
                }
            }
        }
        else{
            response.json().then(res => {
                console.log(res.message);
            });
        }
      });
}