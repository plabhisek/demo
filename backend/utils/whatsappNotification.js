const request = require('request');

const sendWhatsAppMessage = (to, message) => {
  return new Promise((resolve, reject) => {
    const options = {
      method: 'POST',
      url: 'https://api.ultramsg.com/instance111648/messages/chat',
      headers: {'content-type': 'application/x-www-form-urlencoded'},
      form: {
        "token": process.env.WHATSAPP_API_TOKEN || "frq445nxg7che3iy",
        "to": to,
        "body": message,
        "priority": 1
      }
    };

    request(options, (error, response, body) => {
      if (error) {
        console.error('WhatsApp message error:', error);
        reject(error);
      } else {
        console.log('WhatsApp message response:', body);
        resolve({ success: true, response: body });
      }
    });
  });
};

module.exports = { sendWhatsAppMessage };