function loadpage(){
    const form = document.getElementById('register_form');
    form.addEventListener('submit', async (event) =>{
        try{
            event.preventDefault();

            const nameRegex = /^[a-zA-Z]+$/;
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            const minLengthRegex = /^.{8,}$/;
            const specialCharRegex = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/;
            const numberRegex = /\d/;

           
            const firstname=document.getElementById('firstName').value.trim();
            const lastname=document.getElementById('lastName').value.trim();
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value.trim();
            const confirmpassword = document.getElementById('confirmpassword').value.trim();

            const error = document.getElementById('submit-error');

            if(!(nameRegex.test(firstname)) || !(nameRegex.test(lastname))){
                error.innerHTML = 'Please enter a valid name';
                return;
            }else{
                error.innerHTML = ''
            }

            if(!emailRegex.test(email)){
                error.innerHTML = 'Please enter a valid email address';
                return
            }else{
                error.innerHTML = ''
            }

            if(!minLengthRegex.test(password)){
                error.innerHTML = 'Password should contain min 8 characters';
                return;
            }else{
                error.innerHTML = ''
            }

            if(!numberRegex.test(password)){
                error.innerHTML = 'Password should contain a number (0 - 9)';
                return;
            }else{
                error.innerHTML = ''
            }

            if(!specialCharRegex.test(password)){
                error.innerHTML = 'Password should contain a special character (@, !..)';
                return;
            }else{
                error.innerHTML = ''
            }

            if(password != confirmpassword){
                error.innerHTML = 'Passwords does not match';
                return;
            }else{
                error.innerHTML = ''
            }


            const response = await fetch('/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    firstname:firstname,
                    lastname:lastname,
                    email: email,
                    password: password,
                    confirmpassword:confirmpassword

                }),
            });
            if(response.ok){
                window.location.href = '/registerotp';
            }
            else if(response.status == 400){
                const data = await response.json();
                alert(data.message)
            }
        }
        catch(err){
            console.log(err.message)
        }
    })
}