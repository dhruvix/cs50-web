import * as source from './source.js';

let current_page = 1;
let user_data = {};

document.addEventListener('DOMContentLoaded', function () {
    user_data = JSON.parse(document.getElementById('user_data').textContent);
    console.log(user_data);
    const prof_head = document.getElementById('profile-header');
    if(Object.keys(user_data).length === 0){
        prof_head.innerHTML = `<div class="alert alert-danger alert-dismissible fade show" role="alert">
                                    <strong>Oops!</strong> Looks like this page does not exist.
                                    <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                                        <span aria-hidden="true">&times;</span>
                                    </button>
                                </div>`;
    }
    else {
        source.load_posts(`/posts/user/${user_data['id']}`, current_page);
        if(user_data.logged_in > 0 & user_data.logged_in != user_data.id){
            let follow_btn = document.createElement('button');
            follow_btn.className = "btn btn-lg m-2";
            follow_btn.id = "follow_btn";
            follow_btn.addEventListener('click', ()=>handle_follow(user_data['id']))
            if(user_data['following?']){
                follow_btn.classList.add('btn-outline-danger');
                follow_btn.innerHTML = "Unfollow";
            }
            else {
                follow_btn.classList.add('btn-outline-primary');
                follow_btn.innerHTML = "Follow";
            }
            document.querySelector('.card-body').appendChild(follow_btn);
        }
    }

    let next_button = document.getElementById('next-page');
    let prev_button = document.getElementById('prev-page');
    next_button.addEventListener('click', next_page);
    prev_button.addEventListener('click', prev_page);
});

function handle_follow(id){
    let fb = document.getElementById("follow_btn");
    fb.disabled = true;
    let nf = document.getElementById("num_followers");
    const csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value;
    const request = new Request(
        `/follow/${id}`,
        { headers: { 'X-CSRFToken': csrftoken } }
    );
    fetch(request, {
        method: 'PUT'
    }).then(response => response.json())
    .then(res => {
        if(res.error){
            alert(res.error)
        }
        else{
            if(res.message.includes("unfollowed")){
                nf.innerHTML = Number(nf.innerHTML) - 1;
                follow_btn.classList.remove('btn-outline-danger');
                follow_btn.classList.add('btn-outline-primary');
                follow_btn.innerHTML = "Follow";
            }
            else {
                nf.innerHTML = Number(nf.innerHTML) + 1;
                follow_btn.classList.remove('btn-outline-primary');
                follow_btn.classList.add('btn-outline-danger');
                follow_btn.innerHTML = "Unollow";
            }
        }
        fb.disabled = false;
    });
}

function next_page(){
    if(document.getElementById('next-page').classList.contains('disabled')){
        return;
    }
    current_page += 1;
    source.load_posts(`/posts/user/${user_data['id']}`, current_page);
    console.log(`now on page ${current_page}`);
}

function prev_page(){
    if(document.getElementById('prev-page').classList.contains('disabled')){
        return;
    }
    current_page -= 1;
    source.load_posts(`/posts/user/${user_data['id']}`, current_page);
    console.log(`now on page ${current_page}`);
}