let event_id = 0;
let num_cards = 0;
const card_types = [{"id":"TI","display":"Text on the left, Image on the right"}, {"id":"IT","display":"Image on the left, Text on the right"}, {"id":"T","display":"Text only"}, {"id":"I","display":"Image banner"}]

document.addEventListener('DOMContentLoaded', function () {
    // get event id from html template
    event_id = JSON.parse(document.getElementById('event_id').textContent);
    // add an event listener to the edit event, delete event and add card buttons
    let edit_button = document.getElementById("event-edit-button");
    edit_button.addEventListener('click', edit_event);
    let delete_event_button = document.getElementById("delete-event-button");
    delete_event_button.addEventListener('click', delete_event);
    let add_card_button = document.getElementById("add-card-button");
    add_card_button.addEventListener('click', add_card);
    // preload cards
    load_cards();
});

// HELPER FUNCTIONS

// function to determine if the location url provided is an invalid google maps url (not 100% accurate)
function is_invalid_url(url){
    if(url===""){
        return false;
    }
    else{
        if(url.indexOf('https://www.google.com/maps/place/')===-1 && url.indexOf('https://goo.gl/maps/')===-1){
            return true;
        }
        else{
            return false;
        }
    }
}

// function to preview image
function display_image(id){
    let image = document.getElementById(`card-${id}-image`);
    let image_input = document.getElementById(`card-${id}-image-input`);
    image.src = URL.createObjectURL(image_input.files[0]);
    image.onload = function() {
      URL.revokeObjectURL(image.src) // free memory
    }
}

// EVENT FUNCTIONS

function edit_event(){
    // get form data
    let start_date = document.getElementById("event-start-time");
    let end_date = document.getElementById("event-end-time");
    let title = document.getElementById("event-title");
    let event_type = document.getElementById("event-type-select");
    let location = document.getElementById("event-location");
    let thumbnail = document.getElementById("event-thumbnail");
    let isError = false;
    let today = new Date();
    let start_date_date = new Date(start_date.value);
    
    // make sure all the input elements don't have any invalid tags and are empty
    let form_inputs = document.querySelectorAll(".event-form-input");
    form_inputs.forEach(i => {
        i.classList.remove("is-invalid");
    });

    // validate inputs
    if(title.value===""){
        title.classList.add("is-invalid");
        isError = true;
    }

    if(start_date.value==="" || start_date_date<today){
        start_date.classList.add("is-invalid");
        isError = true;
    }

    if(end_date.value==="" || start_date.value>end_date.value){
        end_date.classList.add("is-invalid");
        isError = true;
    }

    if(event_type.value===""){
        event_type.classList.add("is-invalid");
        isError = true;
    }

    if(is_invalid_url(location.value)){
        location.classList.add("is-invalid");
        isError = true;
    }
    // If any of the inputs aren't correct, don't continue with PUT request
    if(isError){
        return;
    }

    const request = new Request(
        `/event/${event_id}`,
        { headers: { 'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value } }
    );

    var formData = new FormData();
    formData.append("thumbnail", thumbnail.files.length>0 ? thumbnail.files[0] : "");
    formData.append("title", title.value);
    formData.append("start", start_date.value);
    formData.append("end", end_date.value);
    formData.append("type", event_type.value);
    formData.append("location", location.value);

    fetch(request, {
        method: 'POST',
        body: formData
    }).then(response => {
        if(response.status === 200){
            display_toast("Event details updated");
        }
        else{
            response.json().then(res => {
                display_toast(res.message);
            });
        }
    });
}

function delete_event(){
    const request = new Request(
        `/event/${event_id}`,
        { headers: { 'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value } }
    );
    fetch(request, {
        method: 'DELETE'
    }).then(response => {
        if(response.status === 204){
            window.location.href = '/events';
        }
        else{
            response.json().then(res => {
                display_toast(res.message);
            });
        }
    });
}

// EVENT CARD FUNCTIONS
function load_cards(){
    const card_display = document.getElementById('card-display');
    card_display.innerHTML = "";
    const request = new Request(
        `/cards/${event_id}`,
        { headers: { 'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value } }
    );
    fetch(request).then(response => {
        if(response.status === 200){
            response.json().then(res => {
                num_cards = res.num_cards;
                if(num_cards>0){
                    res.cards.forEach(card =>{
                        let event_card = document.createElement('div');
                        event_card.className = "card m-2";
                        event_card.id = `event-card-${card.id}`;
                        event_card.innerHTML = `<div class="card-header"></div>`;
                        
                        let card_body = document.createElement('div');
                        card_body.className = "card-body";
                        let row = document.createElement('div');
                        row.className = "row g-2";
                        
                        let col1 = document.createElement('div');
                        col1.className = "col-md-8";
                        col1.innerHTML = `<label for="card-${card.id}-type" class="form-label">Card style type:</label>`;
                        let type_selector = document.createElement('select');
                        type_selector.className = "form-select event-form-input mb-2";
                        type_selector.id = `card-${card.id}-type`;
                        type_selector.value = `${card.type}`;
                        card_types.forEach(c => {
                            let option = document.createElement('option');
                            option.value = `${c.id}`;
                            option.innerHTML = `${c.display}`;
                            if(c.id === card.type){
                                option.setAttribute("selected", "")
                            }
                            type_selector.append(option);
                        });
                        col1.append(type_selector);
                        let c_text = document.createElement('div');
                        c_text.innerHTML = `<label for="card-${card.id}-text" class="form-label">Card text:</label>
                                            <textarea class="form-control" id="card-${card.id}-text" rows="7">${card.text}</textarea>`;
                        col1.append(c_text)

                        let col2 = document.createElement('div');
                        col2.className = "col-md-4";
                        col2.innerHTML = `<div class="input-group input-group-sm">
                                            <label class="input-group-text" for="card-${card.id}-image-input">Choose card Image</label>
                                            <input type="file" accept="image/*" class="form-control event-form-input" id="card-${card.id}-image-input" onchange="display_image(${card.id})">
                                            </div>`;
                        let c_image = document.createElement('div');
                        c_image.innerHTML = card.image? `<img class="card-image mt-1" id="card-${card.id}-image" src="/media/${card.image}"></img>` : `<img class="card-img mt-1" id="card-${card.id}-image" src="/static/assets/no_image.png"></img>`;
                        col2.append(c_image);

                        row.append(col1);
                        row.append(col2);
                        card_body.append(row);
                        event_card.appendChild(card_body);

                        let card_footer = document.createElement('div');
                        card_footer.className = "card-footer text-body-secondary";
                        let card_save_button = document.createElement('button');
                        card_save_button.classList = "btn btn-outline-success me-1";
                        card_save_button.innerHTML = "Save";
                        let up_button = document.createElement('button');
                        up_button.classList = "btn btn-warning me-1";
                        up_button.innerHTML = `<i class="bi bi-caret-up-fill">`;
                        let down_button = document.createElement('button');
                        down_button.classList = "btn btn-warning me-1";
                        down_button.innerHTML = `<i class="bi bi-caret-down-fill">`;
                        let card_delete_button = document.createElement('button');
                        card_delete_button.classList = "btn btn-outline-danger me-1";
                        card_delete_button.innerHTML = `<i class="bi bi-trash3"></i>`;
                        card_save_button.addEventListener('click', ()=>card_save(card.id));
                        up_button.addEventListener('click', ()=>card_up(card.id, card.position));
                        down_button.addEventListener('click', ()=>card_down(card.id, card.position));
                        card_delete_button.addEventListener('click', ()=>card_delete(card.id));
                        card_footer.appendChild(card_save_button);
                        card_footer.appendChild(up_button);
                        card_footer.appendChild(down_button);
                        card_footer.appendChild(card_delete_button);
                        event_card.appendChild(card_footer);

                        card_display.appendChild(event_card);
                    })
                }
            });
        }
        else{
            response.json().then(res => {
                display_toast(res.message);
            });
        }
    });
}

// Shift event card up
function card_up(id, pos){
    var formData = new FormData();
    formData.append("direction", "up");
    formData.append("position", pos);
    const request = new Request(
        `/shift_card/${id}`,
        { headers: { 'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value } }
    );
    fetch(request, {
        method: 'POST',
        body: formData
    }).then(response => {
        if (response.status === 200){
            response.json().then(res => {
                if (res.shifted === true) {
                    load_cards();
                } else {
                    display_toast("You cannot move this card up.");
                }
            })
        } else {
            display_toast("Error in shifting card.");
        }
    });
}

// Shift event card down
function card_down(id, pos){
    var formData = new FormData();
    formData.append("direction", "down");
    formData.append("position", pos);
    const request = new Request(
        `/shift_card/${id}`,
        { headers: { 'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value } }
    );
    fetch(request, {
        method: 'POST',
        body: formData
    }).then(response => {
        if (response.status === 200){
            response.json().then(res => {
                if (res.shifted === true) {
                    load_cards();
                } else {
                    display_toast("You cannot move this card down.");
                }
            })
        } else {
            display_toast("Error in shifting card.");
        }
    });
}

// Save changes made to card with id id.
function card_save(id){
    // Get form data
    let text = document.getElementById(`card-${id}-text`);
    let type = document.getElementById(`card-${id}-type`);
    let image = document.getElementById(`card-${id}-image-input`);

    var formData = new FormData();
    formData.append("image", image.files.length>0 ? image.files[0] : "");
    formData.append("text", text.value);
    formData.append("type", type.value);

    console.log(type.value);

    const request = new Request(
        `/cards/${id}`,
        { headers: { 'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value } }
    );
    fetch(request, {
        method: 'POST',
        body: formData
    }).then(response => {
        if(response.status === 200){
            display_toast("Changes saved!");
        }
        else{
            response.json().then(res => {
                display_toast(res.message);
            });
        }
    });
}

function card_delete(id){
    // get card element to delete
    let e_card = document.getElementById(`event-card-${id}`);
    const request = new Request(
        `/cards/${id}`,
        { headers: { 'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value } }
    );
    fetch(request, {
        method: 'DELETE'
    }).then(response => {
        if(response.status === 204){
            num_cards -= 1;
            e_card.remove();
            display_toast("Card deleted");
        }
        else{
            response.json().then(res => {
                display_toast(res.message);
            });
        }
    });
}

function add_card(){
    // Limit number of event cards to 10
    if(num_cards===10){
        display_toast("You can't have more than 10 cards");
        return
    }
    const card_display = document.getElementById('card-display');
    const request = new Request(
        `/cards/${event_id}`,
        { headers: { 'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value } }
    );
    fetch(request, {
        method: 'PUT'
    }).then(response => {
        if(response.status === 200){
            response.json().then(res => {
                if(num_cards===0){
                    card_display.innerHTML="";
                }
                let event_card = document.createElement('div');
                event_card.className = "card m-2";
                event_card.innerHTML = `<div class="card-header">
                                            new card
                                        </div>`;
                
                let card_body = document.createElement('div');
                card_body.className = "card-body";
                let row = document.createElement('div');
                row.className = "row g-2";
                
                let col1 = document.createElement('div');
                col1.className = "col-md-8";
                col1.innerHTML = `<label for="card-${res.card.id}-type" class="form-label">Card style type:</label>`;
                let type_selector = document.createElement('select');
                type_selector.className = "form-select event-form-input mb-2";
                type_selector.id = `card-${res.card.id}-type`;
                type_selector.value = `${res.card.type}`;
                card_types.forEach(c => {
                    let option = document.createElement('option');
                    option.value = `${c.id}`;
                    option.innerHTML = `${c.display}`;
                    if(c.id === res.card.type){
                        option.setAttribute("selected", "")
                    }
                    type_selector.append(option);
                });
                col1.append(type_selector);
                let c_text = document.createElement('div');
                c_text.innerHTML = `<label for="card-${res.card.id}-text" class="form-label">Card text:</label>
                                    <textarea class="form-control" id="card-${res.card.id}-text" rows="7">${res.card.text}</textarea>`;
                col1.append(c_text)
            
                let col2 = document.createElement('div');
                col2.className = "col-md-4";
                col2.innerHTML = `<div class="input-group input-group-sm">
                                    <label class="input-group-text" for="card-${res.card.id}-image-input">Choose card Image</label>
                                    <input type="file" accept="image/*" class="form-control event-form-input" id="card-${res.card.id}-image-input" onchange="display_image(${res.card.id})">
                                    </div>`;
                let c_image = document.createElement('div');
                c_image.innerHTML = `<img class="card-image mt-1" id="card-${res.card.id}-image" src="/static/assets/no_image.png"></img>`;
                col2.append(c_image);
            
                row.append(col1);
                row.append(col2);
                card_body.append(row);
                event_card.appendChild(card_body);
            
                let card_footer = document.createElement('div');
                card_footer.className = "card-footer text-body-secondary";
                let card_save_button = document.createElement('button');
                card_save_button.classList = "btn btn-outline-success me-1";
                card_save_button.innerHTML = "Save";
                let up_button = document.createElement('button');
                up_button.classList = "btn btn-warning me-1";
                up_button.innerHTML = `<i class="bi bi-caret-up-fill">`;
                let down_button = document.createElement('button');
                down_button.classList = "btn btn-warning me-1";
                down_button.innerHTML = `<i class="bi bi-caret-down-fill">`;
                let card_delete_button = document.createElement('button');
                card_delete_button.classList = "btn btn-outline-danger me-1";
                card_delete_button.innerHTML = `<i class="bi bi-trash3"></i>`;
                card_save_button.addEventListener('click', ()=>card_save(res.card.id));
                up_button.addEventListener('click', ()=>card_up(res.card.id, res.card.position));
                down_button.addEventListener('click', ()=>card_down(res.card.id, res.card.position));
                card_delete_button.addEventListener('click', ()=>card_delete(res.card.id));
                card_footer.appendChild(card_save_button);
                card_footer.appendChild(up_button);
                card_footer.appendChild(down_button);
                card_footer.appendChild(card_delete_button);
                event_card.appendChild(card_footer);
            
                card_display.appendChild(event_card);
                num_cards += 1;
            })
        }
        else{
            response.json().then(res => {
                display_toast(res.message);
            });
        }
    });
}

function display_toast(message) {
    // display message in the toast
    const edit_toast = document.getElementById('edit-toast');
    const toast = new bootstrap.Toast(edit_toast);
    let toast_body = document.querySelector('.toast-body');
    toast_body.innerHTML = message;
    toast.show();
}