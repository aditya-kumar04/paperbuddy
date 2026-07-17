import { login } from './src/controllers/auth.js';

const credentialsList = [
  { role: 'Super Admin', email: 'superadmin@paperbuddy.com', password: 'SuperAdmin123!' },
  { role: 'School Admin', email: 'admin@greenwood.com', password: 'Admin123!' },
  { role: 'Accountant', email: 'accountant@greenwood.com', password: 'Accountant123!' },
  { role: 'Student', email: 'student@greenwood.com', password: 'Student123!' }
];

async function runDiagnostics() {
  for (const creds of credentialsList) {
    console.log(`\n--------------------------------------------`);
    console.log(`Diagnosing login for: ${creds.role} (${creds.email})...`);
    console.log(`--------------------------------------------`);
    
    const req = {
      body: {
        email: creds.email,
        password: creds.password
      }
    };

    let statusResult = null;
    let jsonResult = null;

    const res = {
      status: function(code) {
        statusResult = code;
        return this;
      },
      json: function(data) {
        jsonResult = data;
        return this;
      }
    };

    try {
      await login(req, res);
      console.log('Status Returned:', statusResult || 200);
      if (jsonResult && jsonResult.error) {
        console.error('FAIL (Controller returned error):', jsonResult.error);
      } else {
        console.log('SUCCESS. User payload token length:', jsonResult?.accessToken?.length);
      }
    } catch (err) {
      console.error('CRITICAL CRASH during controller execution:', err);
    }
  }
}

runDiagnostics();
