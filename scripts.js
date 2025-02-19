window.onload = async function () {
  try {
    const snapshot = await db.collection("employees").get();
    snapshot.forEach((doc) => {
      employees.push({ id: doc.id, ...doc.data() });
    });

    // Set the initial value for the conversion rate input
    document.getElementById("conversionRate").value = conversionRate;

    // Attach the event listener to the conversion rate input
    document
      .getElementById("conversionRate")
      .addEventListener("input", updateConversionRate);

    // Initial call to generatePayslip to display default values
    generatePayslip();
  } catch (error) {
    console.error("Error fetching employees:", error);
  }
};

let debounceTimer;

// Initialize the employees array at the top
let employees = [];

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

let conversionRate = parseFloat(localStorage.getItem("conversionRate")) || 1;

window.onload = async function () {
  try {
    const snapshot = await db.collection("employees").get();
    snapshot.forEach((doc) => {
      employees.push({ id: doc.id, ...doc.data() });
    });
    document.getElementById("conversionRate").value = conversionRate;
  } catch (error) {
    console.error("Error fetching employees:", error);
  }
};

// Debounce function to limit the rate of function calls
function debounce(func, delay) {
  return function (...args) {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => func.apply(this, args), delay);
  };
}

// Attach the debounced fetchEmployeeData function to input event
document
  .getElementById("name")
  .addEventListener("input", debounce(fetchEmployeeData, 300));

// Fetch employee data and populate the form
async function fetchEmployeeData() {
  const enteredName = document
    .getElementById("name")
    .value.trim()
    .toLowerCase();
  console.log("Searching for employee:", enteredName);

  if (enteredName.length === 0) {
    return;
  }

  try {
    console.log("Employee data available:", employees);
    const foundEmployee = employees.find((employee) => {
      const employeeName = employee.name.toLowerCase().trim();
      console.log("Comparing with:", employeeName);
      return employeeName === enteredName;
    });

    if (foundEmployee) {
      document.getElementById("email").value = foundEmployee.email || "";
      document.getElementById("position").value = foundEmployee.position || "";
      document.getElementById("salary").value = foundEmployee.salary || "";
      document.getElementById("deductions").value =
        foundEmployee.deductions || "";
      document.getElementById("tax").value = foundEmployee.tax || "";
      console.log("Employee found:", foundEmployee);
    } else {
      console.log("No matching employee found.");
      // Optionally clear the form if needed or show a message
      // clearForm(); // Uncomment this line if you want to clear the form when no match is found
    }
  } catch (error) {
    console.error("Error fetching employee data:", error);
  }
}

function updateConversionRate() {
  conversionRate = parseFloat(document.getElementById("conversionRate").value);
  localStorage.setItem("conversionRate", conversionRate);

  // Display a popup message when the rate changes
  alert(`Conversion rate has been changed to ${conversionRate.toFixed(2)}`);

  // No call to generatePayslip here to ensure it doesn't generate the payslip
}

// Function to handle only updating the rate when the button is clicked
document.getElementById("updateRateBtn").addEventListener("click", () => {
  updateConversionRate(); // Just update the conversion rate
});

function clearForm() {
  document.getElementById("name").value = "";
  document.getElementById("email").value = "";
  document.getElementById("position").value = "";
  document.getElementById("salary").value = "";
  document.getElementById("deductions").value = "";
  document.getElementById("tax").value = "";
  document.getElementById("conversionRate").value = "160"; // Default value
}

function generatePayslip() {
  const name = document.getElementById("name").value.trim().toLowerCase();

  // Check if the employee exists in the database
  const foundEmployee = employees.find((employee) => {
    return employee.name.toLowerCase().trim() === name;
  });

  if (!foundEmployee) {
    alert("Employee not found in the database. Please add the employee first.");
    return; // Exit the function if the employee is not found
  }

  const email = document.getElementById("email").value;
  const position = document.getElementById("position").value;
  const salary = parseFloat(document.getElementById("salary").value);
  const deductions = parseFloat(document.getElementById("deductions").value);
  const taxPercentage = parseFloat(document.getElementById("tax").value);

  // Calculate the tax amount based on the new exchange rate
  const taxAmount = (taxPercentage / 100) * salary;

  const netPayAfterDeductions = salary - taxAmount - deductions;
  const netPayUSD80 = netPayAfterDeductions * 0.8;
  const netPayLD20 = netPayAfterDeductions * 0.2 * conversionRate;

  document.getElementById("payslipName").innerText = name;
  document.getElementById("payslipEmail").innerText = email;
  document.getElementById("payslipPosition").innerText = position;
  document.getElementById("payslipSalary").innerText = salary.toFixed(2);
  document.getElementById("payslipDeductions").innerText =
    deductions.toFixed(2);
  document.getElementById("payslipTax").innerText = taxAmount.toFixed(2);
  document.getElementById("payslipNetPayUSD").innerText =
    netPayUSD80.toFixed(2);
  document.getElementById("payslipNetPayLD").innerText = netPayLD20.toFixed(2);
  document.getElementById("payslipRate").innerText = conversionRate.toFixed(2);
  document.getElementById("payslipDate").innerText =
    new Date().toLocaleDateString();

  document.getElementById("payslip").classList.remove("d-none");

  document.getElementById("sendEmailBtn").addEventListener("click", () =>
    sendPayslipEmail(email, {
      name,
      position,
      salary,
      deductions,
      tax: taxAmount,
      netPayUSD: netPayUSD80,
      netPayLD: netPayLD20,
      rate: conversionRate,
      date: new Date().toLocaleDateString(),
    })
  );

  clearForm();
}

function sendPayslipEmail(
  email,
  { name, position, salary, deductions, tax, netPayUSD, netPayLD, rate, date }
) {
  if (email) {
    const subject = encodeURIComponent("Your Payslip");
    const body = encodeURIComponent(`
      Dear ${name},

      Here is your payslip:

      Position: ${position}
      Gross Salary: $${salary.toFixed(2)}
      Income Tax: $${deductions.toFixed(2)}
      Nascorp Tax: $${tax.toFixed(2)}
      Net Pay in USD: $${netPayUSD.toFixed(2)}
      Net Pay in LD: LD${netPayLD.toFixed(2)}
      Conversion Rate: ${rate.toFixed(2)}
      Date: ${date}

      Thank you,
      NEC Liberia
    `);

    const mailtoLink = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
      email
    )}&su=${subject}&body=${body}`;
    window.open(
      mailtoLink,
      "_blank",
      "width=600,height=600,scrollbars=yes,resizable=yes"
    );
  } else {
    printPayslip();
  }
}

async function addEmployee() {
  const name = document.getElementById("name").value.trim().toLowerCase();
  const email = document.getElementById("email").value;
  const position = document.getElementById("position").value;
  const salary = parseFloat(document.getElementById("salary").value);
  const deductions = parseFloat(document.getElementById("deductions").value);
  const tax = parseFloat(document.getElementById("tax").value);

  try {
    // Check if employee with the same name already exists
    const snapshot = await db
      .collection("employees")
      .where("name", "==", name)
      .get();

    if (!snapshot.empty) {
      // Employee with the same name already exists, update their information
      const docId = snapshot.docs[0].id; // Get the document ID of the first match
      await db.collection("employees").doc(docId).update({
        email,
        position,
        salary,
        deductions,
        tax,
      });

      console.log(`Employee information updated for ID:`, docId);

      // Update the employee in the local array as well
      const index = employees.findIndex((employee) => employee.id === docId);
      if (index !== -1) {
        employees[index] = {
          id: docId,
          name,
          email,
          position,
          salary,
          deductions,
          tax,
        };
      }
    } else {
      // Employee does not exist, add a new one
      const docRef = await db.collection("employees").add({
        name,
        email,
        position,
        salary,
        deductions,
        tax,
      });

      console.log(`Employee added to employees collection with ID:`, docRef.id);

      // Add the new employee to the local array
      employees.push({
        id: docRef.id,
        name,
        email,
        position,
        salary,
        deductions,
        tax,
      });
    }
  } catch (error) {
    console.error("Error adding/updating employee:", error);
  }
}

document.addEventListener("contextmenu", function (e) {
  e.preventDefault();
});

document.addEventListener("keydown", function (e) {
  if (e.key === "F12" || (e.ctrlKey && e.shiftKey && e.key === "I")) {
    e.preventDefault();
  }
});
function sendEmail() {
  // Get the email from the input field
  const employeeEmail = document.getElementById("email").value;

  // Check if the email is valid
  if (employeeEmail) {
    const subject = "Your Payslip for the Month";
    const body = "Please find attached your payslip for this month.";

    // Opens the email client with pre-filled details
    window.location.href = `mailto:${employeeEmail}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;
  } else {
    alert("Please enter a valid email address.");
  }
}
document
  .getElementById("printPayslipBtn")
  .addEventListener("click", printPayslip);

function printPayslip() {
  const payslipContent = document.getElementById("payslip").innerHTML;
  const printWindow = window.open("", "", "height=800,width=600");

  printWindow.document.open();
  printWindow.document.write("<html><head><title>Payslip</title>");
  printWindow.document.write(
    '<link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css" />'
  );
  // Adding custom styles for print
  printWindow.document.write(`
      <style>
        body {
          font-family: "Arial", sans-serif;
        }
        .payslip {
          max-width: 100%;
          margin: 0;
          padding: 20px;
          background: white;
          border: 1px solid #ccc;
          box-shadow: none;
        }
        .header {
          background-color: #002060;
          color: white;
          text-align: center;
          padding: 10px 0;
          font-size: 1.2rem;
          font-weight: bold;
        }
        .header img {
          display: block;
          margin: 0 auto;
          width: 70px;
          height: auto;
        }
        .payslip-section, .net-pay-section {
          margin-bottom: 10px;
        }
        .net-pay-section {
          font-size: 1.2rem;
        }
        .footer {
          margin-top: 20px;
          text-align: center;
          font-size: 0.9rem;
          color: #555;
        }
        @media print {
          .payslip {
            box-shadow: none;
            border: none;
            background: white;
          }
          .btn-primary {
            display: none;
          }
          .modal {
            display: none;
          }
        }
      </style>
    `);
  printWindow.document.write("</head><body>");
  printWindow.document.write(payslipContent);
  printWindow.document.write("</body></html>");
  printWindow.document.close();
  printWindow.print();
}
