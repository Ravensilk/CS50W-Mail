document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);


  // By default, load the inbox
  load_mailbox('inbox');

  document.querySelector('#compose-form').addEventListener("submit", (event) => {
    event.preventDefault();
    post_email();
  })

  archiveBtn = document.querySelector('#archive-btn');
  archiveBtn.addEventListener('click', () => {
    archive_email(archiveBtn.dataset.id)
  })

  readBtn = document.querySelector('#mark-unread-btn');
  readBtn.addEventListener('click', () => {
    read_email(readBtn.dataset.id)
  })
  
});

function archive_email(emailid) {
  fetch(`/emails/${emailid}`, {
    method: "GET"
  })
  .then(response => response.json())
  .then(email => {
    arcStatus = email.archived;

    if (arcStatus){
      archiveStatus = false;
    } else {
      archiveStatus = true;
    }

    fetch(`/emails/${emailid}`, {
      method: 'PUT',
      body: JSON.stringify({
        archived: archiveStatus
      })
    })
    setTimeout( () => {
      load_mailbox('inbox');
    }, 250);
  });
}

function read_email(emailid) {
  fetch(`/emails/${emailid}`, {
    method: "GET"
  })
  .then(response => response.json())
  .then(email => {
    readStatus = email.read;

    if (readStatus){
      readStat = false;
    } else {
      readStat = true;
    }

    fetch(`/emails/${emailid}`, {
      method: 'PUT',
      body: JSON.stringify({
        read: readStat
      })
    })
    setTimeout( () => {
      load_mailbox('inbox');
    }, 250);
  });
}

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#email-content').style.display = 'none';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function view_email(emailid) {
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-content').style.display = 'block';

  fetch(`/emails/${emailid}`, {
    method: "GET"  
  })
  .then(response => response.json())
  .then(email => {
    document.querySelector('#email-subject').innerHTML  = `<h2>${email.subject.slice(0, email.subject.length + 1)}</h2>`;
    document.querySelector('#email-sender').innerHTML  = `<span><span class="text-secondary">From:</span> ${email.sender}</span>`;
    document.querySelector('#email-timestamp').innerHTML  = `<span>${email.timestamp}</span>`;
    document.querySelector('#email-recipients').innerHTML  = `<span><span class="text-secondary">To:</span> ${(email.recipients.map(email => email).join(", "))}</span>`;
    document.querySelector('#email-body').innerHTML  = `<span>${email.body}</span>`;
    document.querySelector('#archive-btn').dataset.id = email.id;
    document.querySelector('#archive-btn').dataset.status = email.archived;
    document.querySelector('#mark-unread-btn').dataset.id = email.id;
    document.querySelector('#mark-unread-btn').dataset.status = email.archived;
    if (email.archived) {
      document.querySelector('#archive-btn').textContent = "Unarchive";
    }
    document.querySelector('#reply-btn').addEventListener('click', () => {
      document.querySelector('#emails-view').style.display = 'none';
      document.querySelector('#compose-view').style.display = 'block';
      document.querySelector('#email-content').style.display = 'none';

      document.querySelector('#compose-recipients').value = email.sender;
      document.querySelector('#compose-subject').value = `Re: ${email.subject}`;
      document.querySelector('#compose-body').value = `\n\n\nOn ${email.timestamp} ${email.sender} wrote: ${email.body}`;
    })

  });
  }


function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-content').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = '';
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
  
  // Fetch the messages for the said mailbox
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(result => {
    result.forEach((email) => {
      let emailcontainer = document.createElement('div');
      emailcontainer.classList.add('row', 'd-flex', 'flex-row', 'justify-content-between', 'border', 'border-dark', 'mx-1', 'my-1', 'p-1', 'email-details');
      let emailsender = document.createElement('div');
      emailsender.classList.add('col-2');
      let emailsubject = document.createElement('div');
      emailsubject.classList.add('col-7');
      let emailtimestamp = document.createElement('div');
      emailtimestamp.classList.add('col-2');
      emailsender.innerHTML = `${email.sender}`;
      if (email.subject.length > 95){
        if (email.read) {
          email.subject = email.subject.slice(0, 87) + "...";
        }
        else {
          email.subject = email.subject.slice(0, 93) + "...";
        }
      }
      emailsubject.innerHTML = `${email.subject}`;
      emailtimestamp.innerHTML = `${email.timestamp}`;
      emailcontainer.append(emailsender, emailsubject, emailtimestamp);
      emailcontainer.addEventListener('click', () => {
        if (!email.read) {
          fetch(`/emails/${email.id}`, {
            method: "PUT",
            body: JSON.stringify({
              read: true
            })
          })
        }
        view_email(email.id);
      })
      if (email.read) {
        emailcontainer.style.backgroundColor = "#88888835";
      }
      else {
        emailcontainer.style.backgroundColor = "white";
        emailcontainer.style.fontWeight = "700";
      }
      document.querySelector('#emails-view').append(emailcontainer);
    })
  });

}

function post_email() {
  fetch('/emails', {
    method: "POST",
    body: JSON.stringify({
      recipients: document.querySelector("#compose-recipients").value,
      subject: document.querySelector("#compose-subject").value,
      body: document.querySelector("#compose-body").value
    })
  })
  .then(response => response.json())
  .then(result => {
    if (result.message == "Email sent successfully.") {
      alert(result.message);
      load_mailbox('sent');
    }
    else {
      alert(result.error);
      compose_email();
    }

})
}