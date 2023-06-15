function save_comment(id){
    let tb = document.getElementById(`comment-textbox-${id}`);
    const csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value;
    const request = new Request(
        '/comment',
        { headers: { 'X-CSRFToken': csrftoken } }
    );
    fetch(request, {
        method: 'POST',
        body: JSON.stringify({
            text: tb.value,
            post_id: Number(id),
        })
    })
        .then(response => {
            if (response.status === 200) {
                response.json().then(res => {
                    let nc = res.new_comment;
                    let all_comments = document.getElementById(`all-comments-${id}`);
                    let new_comment = document.createElement('div');
                    new_comment.className = `card p-1 m-1`;
                    new_comment.innerHTML = `<div class="d-flex w-100 justify-content-between">
                                        <a href="/profile/${nc.user_id}"><small class="badge badge-warning mb-1">${nc.user}</small></a>
                                        <small>${nc.timestamp}</small>
                                    </div>
                                    <p class="mb-1">${nc.text}</p>`;
                    if(all_comments.firstChild.innerHTML==="No comments here :("){
                        all_comments.innerHTML = "";
                    }
                    all_comments.prepend(new_comment);
                    });
                tb.value = "";
            }
            else {
                response.json().then(error => {
                    console.log(error);
                });
            }
    });
}

function load_posts(req, page_num) {
    let next_button = document.getElementById('next-page');
    let prev_button = document.getElementById('prev-page');

    const csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value;
    const request = new Request(
        req + `/${page_num}`,
        { headers: { 'X-CSRFToken': csrftoken } }
    );
    fetch(request)
        .then(response => response.json())
        .then(res => {
            let plist = document.querySelector('#display-posts');
            if (res.posts.length > 0) {
                plist.innerHTML = '';
                res.posts.forEach(post => {
                    console.log(post);

                    let pbox = document.createElement('div');
                    pbox.className = "card bg-light";
                    
                    let pheader = document.createElement('div')
                    pheader.className = "card-header d-flex w-100 justify-content-between";
                    pheader.innerHTML = `<a href="/profile/${post.user_id}" class="text-dark"><strong>${post.user}</strong></a>
                            <small>${post.timestamp}</small>`;
                    pbox.appendChild(pheader);
                    
                    let pbody = document.createElement('div');
                    pbody.className = "card-body";
                    pbody.innerHTML = `<p class="card-text">${post.text}</p>`;
                    pbody.id = `post-${post.id}-body`;
                    pbox.appendChild(pbody);
                    
                    let pbuttons = document.createElement('div');
                    pbuttons.className = "d-flex w-100 justify-content-end";
                    
                    let like_button = document.createElement('button');
                    like_button.disabled = true;
                    like_button.className = "btn btn-sm btn-outline-danger m-1";
                    like_button.innerHTML = `<span>&#9829;</span> ${post.likes}`;
                    like_button.id = `like-btn-${post.id}`;
                    like_button.addEventListener('click', ()=>handle_like(post.id));
                    
                    if(res.logged_in){
                        like_button.disabled = false;
                        if(post.user_liked){
                            like_button.classList.remove('btn-outline-danger');
                            like_button.classList.add('btn-danger');
                        }

                        if(res.logged_in===post.user_id){
                            let edit_button = document.createElement('button');
                            edit_button.className = "btn btn-sm btn-outline-info m-1";
                            edit_button.innerHTML = "Edit";
                            edit_button.id = `edit-btn-${post.id}`;
                            edit_button.addEventListener('click', ()=>edit_post(post.id));

                            let delete_dropdown = document.createElement('div');
                            delete_dropdown.className = "btn-group dropup";
                            delete_dropdown.innerHTML = `<button class="btn btn-sm btn-outline-danger m-1 dropdown-toggle" type="button" id="dropdownMenuButton" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                                            Delete
                                                        </button>
                                                        <div class="dropdown-menu" aria-labelledby="dropdownMenuButton">
                                                            <h6 class="dropdown-header">Are you sure?</h6>
                                                            <button class="dropdown-item text-danger btn-danger">Yes</button>
                                                            <button class="dropdown-item btn-secondary">No</button>
                                                        </div>`;

                            pbuttons.append(delete_dropdown);
                            delete_dropdown.children[1].children[1].addEventListener('click', ()=>delete_post(post.id));
                            pbuttons.append(edit_button);
                        }
                    }

                    let comment_button = document.createElement('button');
                    comment_button.className = "btn btn-sm btn-outline-secondary m-1";
                    comment_button.setAttribute("aria-expanded", "false");
                    comment_button.setAttribute("aria-controls", `collapseExample-${post.id}`);
                    comment_button.innerHTML = "Comments &#8744;";
                    comment_button.addEventListener('click',()=>toggle_collapse(post.id));
                    pbuttons.append(comment_button);

                    pbuttons.append(like_button);
                    pbox.appendChild(pbuttons);
                    plist.appendChild(pbox);

                    let comment_box = document.createElement('div');
                    comment_box.id = `collapseExample-${post.id}`;
                    comment_box.innerHTML = `<div class="card card-body">
                    <div class="input-group input-group-sm mb-1">
                    <input type="text" class="form-control" placeholder="Add a comment..." aria-label="add comment" id="comment-textbox-${post.id}" aria-describedby="comment-button-${post.id}">
                    <div class="input-group-append">
                        <button class="btn btn-outline-secondary" type="button" id="comment-button-${post.id}">Comment</button>
                    </div>
                    </div>
                    </div>`;

                    let all_comments = document.createElement('div');
                    all_comments.id = `all-comments-${post.id}`;
                    if(post.comments.length>0){
                        post.comments.forEach(comment => {
                            let user_comment = document.createElement('div');
                            user_comment.className = `card p-1 m-1`;
                            user_comment.innerHTML = `<div class="d-flex w-100 justify-content-between">
                                                <a href="/profile/${comment.user_id}"><small class="badge badge-warning mb-1">${comment.user}</small></a>
                                                <small>${comment.timestamp}</small>
                                            </div>
                                            <p class="mb-1">${comment.text}</p>`;
                            all_comments.appendChild(user_comment);
                        });
                    }
                    else {
                        let no_comment = document.createElement('div');
                        no_comment.className = `card p-1 m-1`;
                        no_comment.innerHTML = "No comments here :(";
                        all_comments.appendChild(no_comment);
                    }

                    comment_box.append(all_comments);
                    comment_box.classList.add("collapse");
                    pbox.append(comment_box);

                    let comment_submit_button = document.getElementById(`comment-button-${post.id}`)
                    if(res.logged_in){
                        comment_submit_button.addEventListener('click', ()=>save_comment(post.id));
                    }
                    else {
                        comment_submit_button.classList.add('disabled');
                        comment_submit_button.innerHTML = "Log in to comment";
                    }
                });

                next_button.classList.remove('disabled');
                prev_button.classList.remove('disabled');
                if(res.current_page === 1){
                    prev_button.classList.add('disabled');
                }
                if(res.current_page === res.last_page){
                    next_button.classList.add('disabled');
                }
            }
            else {
                plist.innerHTML = `<div class="alert alert-warning alert-dismissible fade show" role="alert">
                               <strong>Oops!</strong> Looks like there's nothing here.
                              <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                                <span aria-hidden="true">&times;</span>
                              </button>
                            </div>`;
            }
        });
}

function handle_like(id){
    let lb = document.getElementById(`like-btn-${id}`);
    lb.disabled = true;
    const csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value;
    const request = new Request(
        `/like/${id}`,
        { headers: { 'X-CSRFToken': csrftoken } }
    );
    fetch(request, {
        method: 'PUT'
    }).then(response => response.json())
    .then(res => {
        let lbih = lb.innerHTML.split(" ");
        if(res.message === "Like saved"){
            lb.classList.remove('btn-outline-danger');
            lb.classList.add('btn-danger');
            lbih[1] = Number(lbih[1]) + 1;
        }
        else {
            lb.classList.remove('btn-danger');
            lb.classList.add('btn-outline-danger');
            lbih[1] = Number(lbih[1]) - 1;
        }
        lb.innerHTML = `${lbih[0]} ${lbih[1]}`;
        lb.disabled = false;
    });
}

function edit_post(id){
    let b = document.getElementById(`post-${id}-body`);
    if(b.children[0].nodeName === "DIV"){
        // This is so that the edit button doesn't do anything when the text area is displayed
        return
    };
    let op = b.children[0].innerHTML;
    b.innerHTML = `<div class="form-group">
                    <label for="textarea-${id}">Edit this post</label>
                    <textarea class="form-control" id="textarea-${id}" rows="3">${op}</textarea>
                    <button class="btn btn-sm btn-success m-2" id="save-post-${id}-btn">Save</button>
                </div>`;
    document.getElementById(`edit-btn-${id}`).classList.add("disabled");
    document.getElementById(`save-post-${id}-btn`).addEventListener('click', ()=>save_post(id));
}

function save_post(id){
    let b = document.getElementById(`post-${id}-body`);
    let ta = document.getElementById(`textarea-${id}`);
    const csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value;
    const request = new Request(
        `/post/${id}`, //url to edit the post
        { headers: { 'X-CSRFToken': csrftoken } }
    );

    if(ta){
        fetch(request, {
            method: 'PUT',
            body: JSON.stringify({
                text: ta.value
            })
        }).then(response => response.json())
        .then(res => {
            if(res.error){
                alert(res.error);
            }
            if(res.message.includes("has been editted")){
                b.innerHTML = `<p class="card-text">${ta.value}</p>`;
                document.getElementById(`edit-btn-${id}`).classList.remove("disabled");
            }
        });
    }
    else{
        console.log("there is no text area");
    }
}

function delete_post(id){
    const csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value;
    const request = new Request(
        `/post/${id}`, //url to delete the post
        { headers: { 'X-CSRFToken': csrftoken } }
    );
    fetch(request, {
        method: 'DELETE'
    }).then(response => {
        if(response.status === 200){
            window.location.reload();
        }
        else{
            response.json().then(error => {
                console.log(error);
            });
        }
    })
}

function toggle_collapse(id){
    $(`#collapseExample-${id}`).collapse("toggle");
}

export {edit_post, handle_like, load_posts}