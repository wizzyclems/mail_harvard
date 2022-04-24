

document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  document.querySelector("#compose-form").onsubmit = send_email;

  // By default, load the inbox
  load_mailbox('inbox');
  localStorage.setItem("mailbox", 'inbox')
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

    return false;
}

function load_mailbox(mailbox) {
  
  localStorage.setItem("mailbox", mailbox)

    // Show the mailbox and hide other views
    document.querySelector('#emails-view').style.display = 'block';
    document.querySelector('#compose-view').style.display = 'none';
    document.querySelector('#view-email').style.display = 'none';

    document.querySelector('#emails-view').replaceChildren();

    // Show the mailbox name
    document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

    //fetch the requested mailbox
    console.log(`The requested mailbox is ${mailbox}`);

    fetch('/emails/' + mailbox)
    .then(response => response.json())
    .then(emails => {
      
        emails_div = document.querySelector("#emails-view");
        emails_div.setAttribute("class", "container");

        //iterate through each email in this mailbox
        emails.forEach(element => {
            email_div = document.createElement("div");
            email_div.setAttribute("class", "row col");
            email_div.setAttribute("data-emailid",element.id)
            email_div.addEventListener('click', function(){
                  email_id = this.dataset.emailid
                  view_email(email_id)
            });

            sender_div = document.createElement("div");
            sender_div.setAttribute("class", "col titles");
            sender_div.innerHTML = element.sender

            subject_div = document.createElement("div");
            subject_div.setAttribute("class", "col-7 titles");
            subject_div.innerHTML = element.subject

            sent_time_div = document.createElement("div");
            sent_time_div.setAttribute("class", "col-3 date-time");
            sent_time_div.innerHTML = element.timestamp

        
            email_div.append(sender_div);
            email_div.append(subject_div);
            email_div.append(sent_time_div);

            action_div = document.createElement("div");
            action_div.setAttribute("class", "col-1 action_bar");

            img_box = document.createElement("img");
            img_box.setAttribute("id","archive_icon");
            img_box.setAttribute("data-emailid",element.id);
            img_box.setAttribute("data-mailbox",mailbox);

            //determines the archive button to display depending on the mailbox of the user.
            if( mailbox === 'inbox' )
            {
              img_box.setAttribute("src","/static/mail/images/archive.png");
              img_box.setAttribute("data-emailarchive",true);
              img_box.setAttribute("alt", "Archive Icon");
              img_box.setAttribute("title", "Archive Icon");
            }else if( mailbox === 'archive' ){
              img_box.setAttribute("src","/static/mail/images/unarchive.png");
              img_box.setAttribute("data-emailarchive",false);
              img_box.setAttribute("alt", "Unarchive Icon");
              img_box.setAttribute("title", "Unarchive Icon");
            }

            img_box.setAttribute("width","18");
            img_box.setAttribute("height","18");
            

            img_box.onclick = (evt) => {
              
               archive_email(evt.target.dataset.emailid, evt.target.dataset.emailarchive === "true" ? true : false);
               //load inbox after 200ms to allow archiving to complete
               setTimeout( load_mailbox('inbox'), 500)

            };

            action_div.append( img_box );

            let row_div = document.createElement("div");
            let class_style = "email_bar row ";
            
            //checks whether the email has been read and styles it accordingly.
            class_style +=  element.read ? " read" : " unread";
            row_div.setAttribute("class",class_style);

            row_div.append(email_div);

            if( mailbox !== 'sent' ){
              row_div.append(action_div);
            }

            //Add the email div to the main container div
            emails_div.append(row_div);

        });

        console.log(`All emails in the mailbox ${mailbox} succesfully loaded and displayed.`);
        
    });
}


function view_email(email_id) {
  
  const mailbox = localStorage.getItem('mailbox');
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#view-email').style.display = 'block';

  document.querySelector('#view-email').replaceChildren();

  //fetch the requested email
  fetch('/emails/' + email_id)
  .then(response => response.json())
  .then(email => {

      view_email_div = document.querySelector("#view-email");

      sender_div = document.createElement("div");
      sender_div.setAttribute("class", "row");
      sender_div.innerHTML = "<span class='titles'>From:</span>&nbsp;&nbsp;" + email.sender;

      to_div = document.createElement("div");
      to_div.setAttribute("class", "row");
      to_div.innerHTML = "<span class='titles'>To:</span>&nbsp;&nbsp;" + email.recipients;

      subject_div = document.createElement("div");
      subject_div.setAttribute("class", "row");
      subject_div.innerHTML = "<span class='titles'>Subject:</span>&nbsp;&nbsp;" + email.subject

      sent_time_div = document.createElement("div");
      sent_time_div.setAttribute("class", "row");
      sent_time_div.innerHTML = "<span class='titles'>Timestamp:</span>&nbsp;&nbsp;" + email.timestamp;

      reply_div = document.createElement("div");
      reply = document.createElement("button");
      reply.setAttribute("id",'reply');
      reply.innerHTML = "Reply"
      
      reply_div.append(reply);

      reply.onclick = () =>  {
         compose_email();
        // Assign values to composition fields
        document.querySelector('#compose-recipients').value = email.sender;
        document.querySelector('#compose-subject').value = email.subject.toLowerCase().indexOf('re:') != -1 ? email.subject : `Re: ${email.subject}`;
        document.querySelector('#compose-body').value = `On ${email.timestamp} ${email.sender} wrote: ${email.body}`;
      }

      archive_btn = document.createElement("button")
      archive_btn.setAttribute("id",'archive');
      archive_btn.setAttribute("data-emailid", email_id);
      

      img_box = document.createElement("img");
      img_box.setAttribute("width","18");
      img_box.setAttribute("height","17");
      img_box.setAttribute("data-emailid", email_id);

      if( mailbox === 'inbox' ){
        img_box.setAttribute("src","/static/mail/images/archive.png");
        archive_btn.setAttribute("data-emailarchive", true)
        img_box.setAttribute("alt", "Archive Icon");
        img_box.setAttribute("title", "Archive Icon");
        img_box.setAttribute("data-emailarchive", true)
      }else if( mailbox === 'archive' ){
        img_box.setAttribute("src","/static/mail/images/unarchive.png");
        archive_btn.setAttribute("data-emailarchive", false)
        img_box.setAttribute("alt", "Unarchive Icon");
        img_box.setAttribute("title", "Unarchive Icon");
        img_box.setAttribute("data-emailarchive", false)
      }

      archive_btn.append(img_box);
      console.log(`the current mailbox is ${mailbox}`)
      archive_btn.onclick = (evt) => {
        console.log(`Archive: ${evt.target.dataset.emailarchive}`)
        console.log(`Email Id: ${evt.target.dataset.emailid}`)
        archive_email(evt.target.dataset.emailid, evt.target.dataset.emailarchive === "true" ? true : false);
        //load inbox after 200ms to allow for archiving to complete.
        setTimeout( load_mailbox('inbox'), 500);
      }

      reply_div.append(document.createTextNode(" "));

      if( mailbox !== 'sent'){
        reply_div.append(archive_btn);
      }
      

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

  mark_email_as_read(email_id, true);
}


function mark_email_as_read(email_id, read_status){
  console.log(`There is a request to change the email with id ${email_id} read status to ${read_status} `)
  fetch('/emails/' + email_id, {
    method: 'PUT',
    body: JSON.stringify({
        read: read_status
    })
  })
}

function archive_email(email_id, archive_status){
  console.log(`There is a request to change the email with id ${email_id} archive status to ${archive_status} `)
  fetch('/emails/' + email_id, {
    method: 'PUT',
    body: JSON.stringify({
        archived: archive_status
    })
  })
}
