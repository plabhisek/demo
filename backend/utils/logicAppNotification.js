const axios = require('axios');

const sendLogicAppNotification = async (email, message) => {
  try {
    const flow_url = "https://prod-12.centralindia.logic.azure.com:443/workflows/30c7e91d4688409d8eecb44729dea5ef/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=kCoUVWAQedBr-UXAwshFCsMqP6b72FkPEetmTtB12m8";
    
    const payload = {
      email: email,
      message: message
    };
    
    const response = await axios.post(flow_url, payload);
    console.log('Logic App notification sent successfully:', response.status);
    return { success: true, response: response.data };
  } catch (error) {
    console.error('Logic App notification error:', error);
    return { success: false, error: error.message };
  }
};

module.exports = { sendLogicAppNotification };