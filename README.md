# Vacation-email-auto-response-app

Set up a new Node.js project and navigate to its directory. We'll need the googleapis package to interact with Gmail's API and the nodemailer package to send emails. 

Install the required dependencies by running the following command -

npm install googleapis nodemailer readline
  
 Set up the OAuth2 client for authentication. You'll need to provide your own Gmail API credentials (client ID, client secret, and redirect URL). The credentials should be stored in a JSON file, e.g., credentials.json. 
Create a function to authenticate with the Gmail API using OAuth2 , Create a function to check for new emails and a function to reply for mails
