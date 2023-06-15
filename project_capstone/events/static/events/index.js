document.addEventListener('DOMContentLoaded', function () {
    // set index nav-link as active
    document.getElementById("index-page").classList.add("active");

    // match passwords only when the registration form is visible
    const logged_in = JSON.parse(document.getElementById('logged_in').textContent);
    if(logged_in === "false"){
        document.getElementById("register-password").addEventListener('keyup', check_password_matching);
        document.getElementById("register-confirmation").addEventListener('keyup', check_password_matching);
    }
});

// function to make sure that both the password fields in theregistration form have the same values
function check_password_matching() {
    let password = document.getElementById("register-password");
    let confirmation = document.getElementById("register-confirmation");
    let feedback = document.getElementById("register-feedback");
    let register = document.getElementById("register-submit");
    if(password.value == confirmation.value) {
        password.classList.remove('is-invalid');
        confirmation.classList.remove('is-invalid');
        feedback.innerHTML = "";
        register.classList.remove('disabled');
    } else {
        password.classList.add('is-invalid');
        confirmation.classList.add('is-invalid');
        feedback.innerHTML = "Passwords don't match";
        register.classList.add('disabled');
    }
}