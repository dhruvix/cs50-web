import * as source from './source.js';

let current_page = 1;

document.addEventListener('DOMContentLoaded', function () {
    console.log(`starting at page ${current_page}`);
    const page_type = JSON.parse(document.getElementById('page_type').textContent);
    if(page_type==="index"){
        document.getElementById('post-form').addEventListener('submit', submit_post);
        source.load_posts("/posts/all", current_page);
    }
    else{
        source.load_posts("/posts/following", current_page);
    }
    let next_button = document.getElementById('next-page');
    let prev_button = document.getElementById('prev-page');
    next_button.addEventListener('click', next_page);
    prev_button.addEventListener('click', prev_page);
});

function submit_post(event) {
    event.preventDefault();
    const csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value;
    const request = new Request(
        '/posts',
        { headers: { 'X-CSRFToken': csrftoken } }
    );
    fetch(request, {
        method: 'POST',
        body: JSON.stringify({
            text: document.querySelector('#message-text').value
        })
    })
        .then(response => {
            if (response.status === 201) {
                $('#exampleModal').modal('hide');
                source.load_posts("/posts/all", current_page);
            }
            else {
                alert("Couldn't create this post!");
            }
        });
}

function next_page(){
    if(document.getElementById('next-page').classList.contains('disabled')){
        return;
    }
    current_page += 1;
    const page_type = JSON.parse(document.getElementById('page_type').textContent);
    if(page_type==="index"){
        source.load_posts("/posts/all", current_page);
    }
    else{
        source.load_posts("/posts/following", current_page);
    }
    console.log(`now on page ${current_page}`);
}

function prev_page(){
    if(document.getElementById('prev-page').classList.contains('disabled')){
        return;
    }
    current_page -= 1;
    const page_type = JSON.parse(document.getElementById('page_type').textContent);
    if(page_type==="index"){
        source.load_posts("/posts/all", current_page);
    }
    else{
        source.load_posts("/posts/following", current_page);
    }
    console.log(`now on page ${current_page}`);
}