// Added nodemailer import and transporter setup to send email on booking form submission
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

const app = express();

// Middleware to log all incoming requests for debugging
app.use((req, res, next) => {
    console.log(`Incoming request: ${req.method} ${req.url}`);
    next();
});

app.use(cors());

const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '.'))); // Serve static files

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;
const REFRESH_TOKEN = process.env.REFRESH_TOKEN;

const oAuth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);
oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

async function createTransporter() {
  try {
    const accessToken = await oAuth2Client.getAccessToken();

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: 'isahayuba40@gmail.com',
        clientId: CLIENT_ID,
        clientSecret: CLIENT_SECRET,
        refreshToken: REFRESH_TOKEN,
        accessToken: accessToken.token,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    return transporter;
  } catch (error) {
    console.error('Failed to create transporter', error);
  }
}

// Route to serve the homepage
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/book', async (req, res) => {
  console.log('Received booking request:', req.body);
  const { name, email, phone, checkin, checkout, guests, requests } = req.body;

  // Read existing bookings
  fs.readFile('bookings.json', 'utf8', async (err, data) => {
    if (err) {
      console.error('Error reading bookings.json:', err);
      return res.json({ success: false, error: 'Failed to read bookings data' });
    }
    let bookings = [];
    try {
      bookings = JSON.parse(data);
    } catch (e) {
      console.error('Error parsing bookings.json:', e);
      bookings = [];
    }

    // Add new booking
    bookings.push({
      name,
      email,
      phone,
      checkin,
      checkout,
      guests,
      requests: requests || 'None',
      timestamp: new Date().toISOString(),
    });

    // Save updated bookings
    fs.writeFile('bookings.json', JSON.stringify(bookings, null, 2), async (err) => {
      if (err) {
        console.error('Error saving booking:', err);
        return res.json({ success: false, error: 'Failed to save booking' });
      }
      console.log('Booking saved successfully.');

      // Send email notification
      const mailOptions = {
        from: 'isahayuba40@gmail.com',
        to: 'isahayuba40@gmail.com',
        subject: 'New Booking for OTamazing Apartments',
        text: `
          New booking received:

          Name: ${name}
          Email: ${email}
          Phone: ${phone}
          Check-in: ${checkin}
          Check-out: ${checkout}
          Guests: ${guests}
          Special Requests: ${requests || 'None'}
        `,
      };

      try {
        const transporter = await createTransporter();
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent: ' + info.response);
        res.json({ success: true });
      } catch (error) {
        console.error('Error sending email:', error.message);
        console.error(error.stack);
        res.json({ success: false, error: error.message });
      }
    });
  });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
