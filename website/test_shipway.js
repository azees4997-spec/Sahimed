const https = require('https');
require('dotenv').config({path: '.env.local'});

async function testTrack() {
  const email = process.env.SHIPWAY_EMAIL;
  const licenseKey = process.env.SHIPWAY_LICENSE_KEY;
  console.log("Email:", email, "License:", licenseKey ? "Exists" : "No");
  const data = JSON.stringify({
    "awb": "77807304606",
    "carrier_id": 0
  });

  const options = {
    hostname: 'shipway.in',
    path: '/api/getOrderShipmentDetails',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Basic ' + Buffer.from(email + ':' + licenseKey).toString('base64'),
      'Content-Length': data.length
    }
  };

  const req = https.request(options, (res) => {
    let result = '';
    res.on('data', (chunk) => result += chunk);
    res.on('end', () => console.log("Response:", result));
  });

  req.on('error', (e) => console.error(e));
  req.write(data);
  req.end();
}

testTrack();
