document.addEventListener('DOMContentLoaded', function () {
    // load all the user's events
    get_user_events("your");
    get_user_events("upcoming");
    get_user_events("attended");
    // set nav-link as active 
    document.getElementById("events-page").classList.add("active");
});

// Generates event cards to display in the My events page
function get_user_events(tag){
    const request = new Request(
        `/events/${tag}`,
        { headers: { 'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value } }
    );
    fetch(request).then(response => {
        if(response.status === 200){
            let events_space = document.getElementById(`${tag}-events`);
            response.json().then(res => {
                console.log(res.message);
                if(res.events.length === 0){
                    events_space.innerHTML = `<h6 class="card-subtitle mb-2 text-muted">No events here </h6>`;
                }
                else {
                    res.events.forEach(event => {
                        let column = document.createElement("div");
                        column.className = "col";
                        let thumbnail = event.thumbnail? `/media/${event.thumbnail}` : `/static/assets/types/${event.type}.jpg`;
                        column.innerHTML = `<div class="card h-100 border-success" style="overflow:hidden;">
                                                <img src="${thumbnail}" class="card-img-top thumbnail" alt="event-${event.id}-thumbnail">
                                                <div class="card-body">
                                                <h5 class="card-title">${event.title}</h5>
                                                <h6 class="card-subtitle mb-2 text-muted">-${event.host}</h6>
                                                <p class="card-text">From ${event.start_date},<br/>to ${event.end_date}.</p>
                                                </div>
                                            </div>`;
                        column.style.cursor = "pointer";
                        column.addEventListener('click', ()=>redirect_to_event(event.id));
                        events_space.appendChild(column);
                    });
                }
            });
        }
        else{
            response.json().then(res => {
                console.log(res.message);
            });
        }
      });
}

// Function to redirect to event page based on id
function redirect_to_event(id) {
    window.location.href = `/events/${id}`;
}