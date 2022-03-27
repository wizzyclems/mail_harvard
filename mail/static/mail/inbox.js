document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  document.querySelector("#compose-form").onsubmit = send_email;

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#view-email').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function send_email(){
    console.log("Submitting the compose form")

    let recipients = document.querySelector('#compose-recipients').value;
    let subject = document.querySelector('#compose-subject').value;
    let body = document.querySelector('#compose-body').value;

    fetch('/emails',{
      method: 'POST',
      body: JSON.stringify({
        recipients: recipients,
        subject: subject,
        body: body
      })
    })
    .then(response => response.json())
    .then(result => {
        console.log(result);
        console.log(`The result of the email submission is : ${result.message}`)

        load_mailbox('sent');
    })

    console.log("We are cancelling the default submit behavior in order to make an api call..")
    return false;
}

function load_mailbox(mailbox) {
  
    // Show the mailbox and hide other views
    document.querySelector('#emails-view').style.display = 'block';
    document.querySelector('#compose-view').style.display = 'none';
    document.querySelector('#view-email').style.display = 'none';

    // Show the mailbox name
    document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

    //fetch the requested mailbox
    console.log(`The requested mailbox is ${mailbox}`);

    fetch('/emails/' + mailbox)
    .then(response => response.json())
    .then(emails => {
        console.log(`loading the inbox data for : ${mailbox}`)
        console.log(emails)

        emails_div = document.querySelector("#emails-view");
        emails_div.setAttribute("class", "container");

        //iterate through each email in this mailbox
        emails.forEach(element => {
            email_div = document.createElement("div");
            email_div.setAttribute("class", "row");
            email_div.setAttribute("data-emailid",element.id)
            email_div.addEventListener('click', function(){
                  email_id = this.dataset.emailid
                  view_email(email_id)
            });

            //checks whether the email has been read and styles it accordingly.
            if( element.read ){
              email_div.setAttribute("style", "border: 1px solid black;margin-bottom: 0.9px");
            }else{
              email_div.setAttribute("style", "border: 1px solid black;margin-bottom: 0.9px;background-color:lightgrey;");
            }

            sender_div = document.createElement("div");
            sender_div.setAttribute("class", "col");
            sender_div.setAttribute("style", "font-weight:bold");
            sender_div.innerHTML = element.sender

            subject_div = document.createElement("div");
            subject_div.setAttribute("class", "col-7");
            subject_div.innerHTML = element.subject

            sent_time_div = document.createElement("div");
            sent_time_div.setAttribute("class", "col-3");
            sent_time_div.setAttribute("style", "color:lightgrey");
            sent_time_div.innerHTML = element.timestamp

            email_div.append(sender_div);
            email_div.append(subject_div);
            email_div.append(sent_time_div);

            //Add the email div to the main container div
            emails_div.append(email_div);

            console.log(`The email with the subject ${element.subject} added to the display list`);
        });

        console.log(`All emails in the mailbox ${mailbox} succesfully loaded and displayed.`);
        
    });
}


function view_email(email_id) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#view-email').style.display = 'block';

  document.querySelector('#view-email').replaceChildren();

  //fetch the requested email
  console.log(`The requested email id is ${email_id}`);

  fetch('/emails/' + email_id)
  .then(response => response.json())
  .then(email => {
      console.log(email)

      view_email_div = document.querySelector("#view-email");

      sender_div = document.createElement("div");
      sender_div.setAttribute("class", "row");
      sender_div.innerHTML = "<b>From: </b>" + email.sender;

      to_div = document.createElement("div");
      to_div.setAttribute("class", "row");
      to_div.innerHTML = "<b>To: </b>" + email.recipients;

      subject_div = document.createElement("div");
      subject_div.setAttribute("class", "row");
      subject_div.innerHTML = "<b>Subject: </b>" + email.subject

      sent_time_div = document.createElement("div");
      sent_time_div.setAttribute("class", "row");
      sent_time_div.innerHTML = "<b>Timestamp: </b>" + email.timestamp;

      reply_div = document.createElement("div");
      reply = document.createElement("button");
      reply.setAttribute("id",'reply');
      reply.innerHTML = "Reply"
      
      reply_div.append(reply);

      divider_div  = document.createElement("div");
      divider  = document.createElement("hr");
      divider_div.append(divider)

      body_div = document.createElement("div");
      body_div.innerHTML = email.body;

      view_email_div.append(sender_div);
      view_email_div.append(to_div);
      view_email_div.append(subject_div);
      view_email_div.append(sent_time_div);
      view_email_div.append(reply_div);
      view_email_div.append(divider_div);
      view_email_div.append(body_div)

  });

  read_email(email_id, true);
}


function read_email(email_id, value){
  console.log(`There is a request to change the email with id ${email_id} read status to ${value} `)
  fetch('/emails/' + email_id, {
    method: 'PUT',
    body: JSON.stringify({
        read: value
    })
  })
}