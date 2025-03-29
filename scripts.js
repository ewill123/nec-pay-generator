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

// Function to capitalize the first letter of each part of the name
function capitalizeName(name) {
  return name
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

// Fetch employee data and populate the form
async function fetchEmployeeData() {
  const enteredName = document
    .getElementById("name")
    .value.toLowerCase()
    .trim();
  console.log("Searching for employee:", enteredName);

  if (enteredName.length === 0) return;

  try {
    console.log("Employee data available:", employees);

    // Normalize name by removing extra spaces
    const normalizeName = (name) =>
      name.toLowerCase().replace(/\s+/g, " ").trim();

    // Split input name into first and last name (if available)
    const nameParts = normalizeName(enteredName).split(" ");
    const firstNameInput = nameParts[0];

    // Find employees with matching first name
    const matchedEmployees = employees.filter((employee) => {
      const [firstName, lastName] = normalizeName(employee.name).split(" ");
      return firstName === firstNameInput;
    });

    if (matchedEmployees.length === 1) {
      // If there's only one match, auto-fill last name and details
      const foundEmployee = matchedEmployees[0];
      const formattedName = capitalizeName(foundEmployee.name); // Capitalize name
      document.getElementById("name").value = formattedName; // Auto-fill full name with formatted name
      document.getElementById("email").value = foundEmployee.email || "";
      document.getElementById("position").value = foundEmployee.position || "";
      document.getElementById("salary").value = foundEmployee.salary || "";
      document.getElementById("deductions").value =
        foundEmployee.deductions || "";
      document.getElementById("tax").value = foundEmployee.tax || "";
      console.log("Employee found:", foundEmployee);
    } else if (matchedEmployees.length > 1) {
      // If multiple employees match, show a dropdown for selection
      let dropdownHTML = `<select id="employeeSelect" onchange="selectEmployee()">`;
      dropdownHTML += `<option value="">Select Employee</option>`;
      matchedEmployees.forEach((emp) => {
        // Use a unique identifier (e.g., employee id) instead of the index
        dropdownHTML += `<option value="${emp.id}">${capitalizeName(
          emp.name
        )}</option>`; // Format name
      });
      dropdownHTML += `</select>`;

      document.getElementById("employeeDropdown").innerHTML = dropdownHTML;
      console.log("Multiple employees found. Showing selection.");
    } else {
      console.log("No matching employee found.");
      // Optionally clear the form if no match is found
      // clearForm();
    }
  } catch (error) {
    console.error("Error fetching employee data:", error);
  }
}

// Function to handle employee selection from the dropdown
function selectEmployee() {
  const selectedId = document.getElementById("employeeSelect").value;
  if (selectedId !== "") {
    const selectedEmployee = employees.find((emp) => emp.id === selectedId); // Find employee by unique id
    if (selectedEmployee) {
      const formattedName = capitalizeName(selectedEmployee.name); // Capitalize name
      document.getElementById("name").value = formattedName;
      document.getElementById("email").value = selectedEmployee.email || "";
      document.getElementById("position").value =
        selectedEmployee.position || "";
      document.getElementById("salary").value = selectedEmployee.salary || "";
      document.getElementById("deductions").value =
        selectedEmployee.deductions || "";
      document.getElementById("tax").value = selectedEmployee.tax || "";
      console.log("Employee selected:", selectedEmployee);
    }
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
    alert(
      "This Employee is not in the database. Please add the employee first."
    );
    return; // Exit the function if the employee is not found
  }

  const email = document.getElementById("email").value;
  const position = document.getElementById("position").value;
  const salary = parseFloat(document.getElementById("salary").value);
  const deductions = parseFloat(document.getElementById("deductions").value);
  const taxPercentage = parseFloat(document.getElementById("tax").value);

  // Get the user-defined percentages for USD and LRD
  let usdPercentage =
    parseFloat(document.getElementById("usdPercentage").value) / 100;
  let lrdPercentage =
    parseFloat(document.getElementById("lrdPercentage").value) / 100;

  // Ensure the total percentage of USD and LRD does not exceed 100%
  const totalPercentage = usdPercentage + lrdPercentage;

  if (totalPercentage > 1) {
    // If the total exceeds 100%, adjust the percentages to ensure they add up to 100%
    const adjustment = totalPercentage - 1;

    // You can adjust USD or LRD based on your preference
    // Example: Adjust LRD percentage to make the total 100%
    lrdPercentage -= adjustment;
    alert("Total percentage exceeds 100%. Adjusting LRD percentage.");
  }

  // Calculate the tax and net pay
  const taxAmount = (taxPercentage / 100) * salary;
  const netPayAfterDeductions = salary - taxAmount - deductions;

  // Apply the user-defined percentages to calculate net pay
  const netPayUSD = netPayAfterDeductions * usdPercentage;
  const netPayLD = netPayAfterDeductions * lrdPercentage * conversionRate;

  // Capitalizing the name for the payslip
  const formattedName = capitalizeName(foundEmployee.name); // Capitalize name

  // Populate the payslip with calculated values
  document.getElementById("payslipName").innerText = formattedName;
  document.getElementById("payslipEmail").innerText = email;
  document.getElementById("payslipPosition").innerText = position;
  document.getElementById("payslipSalary").innerText = salary.toFixed(2);
  document.getElementById("payslipDeductions").innerText =
    deductions.toFixed(2);
  document.getElementById("payslipTax").innerText = taxAmount.toFixed(2);
  document.getElementById("payslipNetPayUSD").innerText = netPayUSD.toFixed(2);
  document.getElementById("payslipNetPayLD").innerText = netPayLD.toFixed(2);
  document.getElementById("payslipRate").innerText = conversionRate.toFixed(2);
  document.getElementById("payslipDate").innerText =
    new Date().toLocaleDateString();

  document.getElementById("payslip").classList.remove("d-none");

  // Sending payslip email
  document.getElementById("sendEmailBtn").addEventListener("click", () =>
    sendPayslipEmail(email, {
      name: formattedName,
      position,
      salary,
      deductions,
      tax: taxAmount,
      netPayUSD,
      netPayLD,
      rate: conversionRate,
      date: new Date().toLocaleDateString(),
    })
  );

  // Clear the form after generating the payslip
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
      Net Pay in LD: $${netPayLD.toFixed(2)}
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

function printPayslip() {
  const payslipContent = document.getElementById("payslip").innerHTML;
  const name = document.getElementById("name").value.trim();

  // Function to capitalize the first letter of each word
  function capitalizeName(name) {
    return name
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  }

  // Capitalizing the name before printing
  const formattedName = capitalizeName(name);

  // Replace the name in the payslip content with the formatted name
  const formattedPayslipContent = payslipContent.replace(name, formattedName);

  const printWindow = window.open("", "", "height=800,width=600");

  printWindow.document.open();
  printWindow.document.write("<html><head><title>Payslip</title>");

  // Bootstrap CDN for styling (if needed)
  printWindow.document.write(
    '<link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css" />'
  );

  // Custom styles for better print formatting
  printWindow.document.write(`
      <style>
        body {
          font-family: "Arial", sans-serif;
          background-color: #f4f4f4;
          margin: 0;
          padding: 0;
        }
        .payslip {
          max-width: 100%;
          margin: 0;
          padding: 20px;
          background: white;
          border: 1px solid #ccc;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
        }
        .header {
          background-color: #002060;
          color: white;
          text-align: center;
          padding: 10px 0;
          font-size: 1.5rem;
          font-weight: bold;
        }
        .header img {
          display: block;
          margin: 0 auto;
          width: 70px;
          height: auto;
        }
        .payslip-section, .net-pay-section {
          margin-bottom: 20px;
        }
        .net-pay-section {
          font-size: 1.5rem;
          font-weight: bold;
        }
        .footer {
          margin-top: 20px;
          text-align: center;
          font-size: 1rem;
          color: #555;
        }
        @media print {
          body {
            background-color: white;
          }
          .payslip {
            box-shadow: none;
            border: none;
            background: white;
          }
          .btn-primary, .modal {
            display: none;
          }
          .header img {
            width: 50px;
            height: auto;
          }
        }
      </style>
    `);

  printWindow.document.write("</head><body>");
  printWindow.document.write(
    `<div class="payslip">${formattedPayslipContent}</div>`
  );
  printWindow.document.write("</body></html>");

  // Close document and trigger print
  printWindow.document.close();
  printWindow.print();
}
