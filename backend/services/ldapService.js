const axios = require('axios');
const AllowedEmployee = require('../models/AllowedEmployee');

const LDAP_AUTH_URL = 'http://195.1.107.128:12001/ldap-authenticate/';

const ldapService = {
  authenticate: async (employeeID, password) => {
    try {
      const response = await axios.post(LDAP_AUTH_URL, {
        employeeID,
        password
      });

      if (!response.data.success) {
        throw new Error('LDAP authentication failed');
      }

      // Check if the employee is in the allowed list
      const isAllowed = await AllowedEmployee.findOne({ employeeID });
      
      return {
        ...response.data.data,
        isAllowed: !!isAllowed
      };
    } catch (error) {
      console.error('LDAP authentication error:', error);
      throw new Error('Authentication failed');
    }
  }
};

module.exports = ldapService;