document.addEventListener('DOMContentLoaded', function () {
    get_event_invites();
    
    //initialize elements reponsible for creating an invite
    let submit_button = document.getElementById("invite-submit");
    if(submit_button){
        submit_button.addEventListener('click', create_invite);
    }
});

function create_invite(){
    // information from the form
    let first_name = document.getElementById("rsvp_first_name").value;
    let last_name = document.getElementById("rsvp_last_name").value;
    let email = document.getElementById("rsvp_email").value;
    const event_id = document.getElementById("rsvp_event").value;
    // variables for the toast functionality
    const invite_toast = document.getElementById('invite-toast');
    const toast = new bootstrap.Toast(invite_toast);
    let toast_body = document.querySelector('.toast-body');
    const request = new Request(
        "/handle_invites",
        { headers: { 'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value } }
    );
    fetch(request, {
        method: 'POST',
        body: JSON.stringify({
            first_name: first_name,
            last_name: last_name,
            email: email,
            event_id: event_id
        })
    }).then(response => {
        if(response.status === 200){
            // Clear all the fields and show the toast
            document.getElementById("rsvp_first_name").value = "";
            document.getElementById("rsvp_last_name").value = "";
            document.getElementById("rsvp_email").value = "";
            toast_body.innerHTML = `invite sent to ${email}`;
            toast.show()
            get_event_invites();
        }
        else{
            response.json().then(res => {
                toast_body.innerHTML = res.message;
                toast.show()
            });
        }
    });
}

function get_event_invites(){
    const event_id = document.getElementById("rsvp_event").value;
    const invites_div = document.getElementById("invite-table");
    invites_div.innerHTML = "";
    const request = new Request(
        `/invites/${event_id}`,
        { headers: { 'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value } }
    );
    fetch(request).then(response => {
        if(response.status === 200){
            response.json().then(res => {
                if(res.invites.length > 0){
                    // create a table
                    let table = document.createElement("table");
                    table.className = "table table-sm table-hover";
                    table.innerHTML = `<thead>
                                            <tr>
                                                <th scope="col">#</th>
                                                <th scope="col">Name</th>
                                                <th scope="col">Email</th>
                                                <th scope="col">Status</th>
                                                <th scope="col">Withdraw</th>
                                            </tr>
                                        </thead>`;
                    // add a row for each invite
                    let tbody = document.createElement("tbody");
                    res.invites.forEach((invite, i) => {
                        let tr = document.createElement("tr");
                        let status = "";
                        if(invite.status === "P"){
                            status = "Pending";
                        }
                        else if(invite.status === "A"){
                            status = "Accepted";
                            tr.className = "table-success";
                        }
                        else if(invite.status === "D"){
                            status = "Declined";
                            tr.className = "table-danger";
                        }
                        tr.innerHTML = `<th scope="row">${i}</th>
                                        <td>${invite.invitee_name}</td>
                                        <td>${invite.invitee_email}</td>
                                        <td>${status}</td>`;
                        let td = document.createElement("td");
                        let withdraw_button = document.createElement('button');
                        withdraw_button.className = "btn btn-secondary";
                        withdraw_button.innerHTML = `<i class="bi bi-envelope-x"></i>`;
                        withdraw_button.addEventListener('click', ()=>delete_invite(invite.id));
                        td.append(withdraw_button);
                        tr.appendChild(td);
                        tbody.appendChild(tr);
                    });
                    table.appendChild(tbody);
                    invites_div.append(table);
                }
                else{
                    invites_div.innerHTML = "You haven't invited anybody yet.";
                }
            });
        }
        else{
            response.json().then(res => {
                invites_div.innerHTML = `${res.message}`;
            });
        }
    });
}

function delete_invite(id){
    const invites_div = document.getElementById("invite-table");
    // display spinner until invites reload
    invites_div.innerHTML = `<div class="spinner-border text-warning" role="status"></div>`;
    const request = new Request(
        "/handle_invites",
        { headers: { 'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value } }
    );
    fetch(request, {
        method: 'DELETE',
        body: JSON.stringify({
            id:id
        })
    }).then(response =>{
        if(response.status === 204){
            get_event_invites();
        }
        else{
            response.json().then(res => {
                console.log(res.message);
            });
        }
    });
}