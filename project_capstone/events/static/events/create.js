document.addEventListener('DOMContentLoaded', function () {
    // set create event nav-link as active
    document.getElementById("create-page").classList.add("active");
    // add an eventlistener to the create event button
    let create_button = document.getElementById("event-create-button");
    create_button.addEventListener('click', create_event);
});

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

function create_event(){
    // show progress bar
    progress_bar = document.getElementById("progress-bar-load");
    progress_bar.style.visibility = 'block';

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
    // If any of the inputs aren't correct, don't continue with POST request
    if(isError){
        progress_bar.style.visibility = 'hidden';
        return;
    }

    const request = new Request(
        "/event/0",
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
            progress_bar.style.visibility = 'hidden';
            window.location.href = '/events';
        }
        else{
            response.json().then(res => {
                console.log(res.message);
            });
        }
    });
}