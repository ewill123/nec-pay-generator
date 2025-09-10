// functions/index.js
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const sgMail = require("@sendgrid/mail");

admin.initializeApp();
const db = admin.firestore();

// Use your SendGrid API Key
sgMail.setApiKey("YOUR_SENDGRID_API_KEY");

exports.sendPayslipEmail = functions.https.onCall(async (data, context) => {
  const {
    email,
    name,
    position,
    salary,
    deductions,
    tax,
    netPayUSD,
    netPayLD,
    rate,
    date,
    month,
  } = data;

  const msg = {
    to: email,
    from: "payroll@yourcompany.com",
    subject: `Your Payslip for ${month}`,
    html: `
      <h3>Dear ${name},</h3>
      <p>Here is your payslip for ${month}:</p>
      <ul>
        <li>Position: ${position}</li>
        <li>Gross Salary: $${salary.toFixed(2)}</li>
        <li>Income Tax: $${deductions.toFixed(2)}</li>
        <li>Nascorp Tax: $${tax.toFixed(2)}</li>
        <li>Net Pay in USD: $${netPayUSD.toFixed(2)}</li>
        <li>Net Pay in LRD: $${netPayLD.toFixed(2)}</li>
        <li>Conversion Rate: ${rate.toFixed(2)}</li>
        <li>Date: ${date}</li>
      </ul>
      <p>Thank you, <br/> NEC Liberia</p>
    `,
  };

  try {
    await sgMail.send(msg);
    return { success: true };
  } catch (error) {
    console.error("Error sending email:", error);
    return { success: false, error: error.message };
  }
});
