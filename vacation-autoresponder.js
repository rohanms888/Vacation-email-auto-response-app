const fs = require('fs');
const readline = require('readline');
const { google } = require('googleapis');
const nodemailer = require('nodemailer');

const credentials = require('./credentials.json');

const { client_id, client_secret, redirect_uris } = credentials.installed;
const oAuth2Client = new google.auth.OAuth2(
  client_id,
  client_secret,
  redirect_uris[0]
);

const SCOPES = ['https://www.googleapis.com/auth/gmail.modify'];
const TOKEN_PATH = 'token.json';

async function authorize() {
  return new Promise((resolve, reject) => {
    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
    });

    console.log('Authorize this app by visiting this URL:', authUrl);

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question('Enter the code from that page here: ', (code) => {
      rl.close();

      oAuth2Client.getToken(code, (err, token) => {
        if (err) {
          reject('Error retrieving access token', err);
        }

        oAuth2Client.setCredentials(token);

        // Store the token for later use
        fs.writeFileSync(TOKEN_PATH, JSON.stringify(token));

        resolve('Authorization successful!');
      });
    });
  });
}

async function checkNewEmails() {
  const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

  const response = await gmail.users.messages.list({
    userId: 'me',
    q: 'is:unread',
  });

  const messages = response.data.messages || [];
  const messageIds = messages.map((message) => message.id);

  return messageIds;
}

async function sendReply(email) {
  const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

  // Prepare the reply email
  const mailOptions = {
    from: 'your-email@gmail.com',
    to: email.from,
    subject: 'Automatic Vacation Reply',
    text: 'Thank you for your email! I am currently on vacation and will reply to your message as soon as possible.',
  };

  // Send the reply email
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      type: 'OAuth2',
      user: 'your-email@gmail.com',
      clientId: client_id,
      clientSecret: client_secret,
      refreshToken: oAuth2Client.credentials.refresh_token,
      accessToken: oAuth2Client.credentials.access_token,
    },
  });

  return new Promise((resolve, reject) => {
    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        reject(err);
      } else {
        resolve(info);
      }
    });
  });
}

async function main() {
  
    if (fs.existsSync(TOKEN_PATH)) {
      oAuth2Client.setCredentials(JSON.parse(fs.readFileSync(TOKEN_PATH)));
    } else {
      await authorize();
    }

    setInterval(async () => {
      const messageIds = await checkNewEmails();

      for (const messageId of messageIds) {
        const response = await gmail.users.messages.get({
          userId: 'me',
          id: messageId,
        });

        const email = response.data;

        // Check if the email thread has no prior replies
        if (!email.historyId) {
          await sendReply(email);
        }
      }
    }, getRandomInterval());
  }
