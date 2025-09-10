let debounceTimer;
let employees = [];
let conversionRate = parseFloat(localStorage.getItem("conversionRate")) || 1;

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: "AIzaSyB3MTQ1TAlv5XybVV2DZDI7v7sCzkVO8yw",
  authDomain: "pay-slip-generator-37980.firebaseapp.com",
  projectId: "pay-slip-generator-37980",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "174710674762",
  appId: "1:174710674762:web:f8755cc8e51ed2ecb29db3",
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Unified window.onload
window.onload = async function () {
  try {
    const snapshot = await db.collection("employees").get();
    snapshot.forEach((doc) => {
      employees.push({ id: doc.id, ...doc.data() });
    });

    document.getElementById("conversionRate").value = conversionRate;

    // Event listeners
    document
      .getElementById("conversionRate")
      .addEventListener("input", updateConversionRate);

    document
      .getElementById("name")
      .addEventListener("input", debounce(fetchEmployeeData, 300));

    generatePayslip();
  } catch (error) {
    console.error("Error fetching employees:", error);
  }
};

// Debounce utility
function debounce(func, delay) {
  return function (...args) {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => func.apply(this, args), delay);
  };
}

// Capitalize full name
function capitalizeName(name) {
  return name
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

// Fetch employee data and populate form
async function fetchEmployeeData() {
  const enteredName = document
    .getElementById("name")
    .value.toLowerCase()
    .trim();
  if (!enteredName) return;

  try {
    const normalizeName = (name) =>
      name.toLowerCase().replace(/\s+/g, " ").trim();
    const nameParts = normalizeName(enteredName).split(" ");
    const firstNameInput = nameParts[0];

    const matchedEmployees = employees.filter((employee) => {
      const [firstName] = normalizeName(employee.name).split(" ");
      return firstName === firstNameInput;
    });

    if (matchedEmployees.length === 1) {
      const foundEmployee = matchedEmployees[0];
      document.getElementById("name").value = capitalizeName(
        foundEmployee.name
      );
      document.getElementById("email").value = foundEmployee.email || "";
      document.getElementById("position").value = foundEmployee.position || "";
      document.getElementById("salary").value = foundEmployee.salary || "";
      document.getElementById("deductions").value =
        foundEmployee.deductions || "";
      document.getElementById("tax").value = foundEmployee.tax || "";
      document.getElementById("employeeDropdown").innerHTML = "";
    } else if (matchedEmployees.length > 1) {
      let dropdownHTML = `<select id="employeeSelect" onchange="selectEmployee()">`;
      dropdownHTML += `<option value="">Select Employee</option>`;
      matchedEmployees.forEach((emp) => {
        dropdownHTML += `<option value="${emp.id}">${capitalizeName(
          emp.name
        )}</option>`;
      });
      dropdownHTML += `</select>`;
      document.getElementById("employeeDropdown").innerHTML = dropdownHTML;
    } else {
      console.log("No matching employee found.");
    }
  } catch (error) {
    console.error("Error fetching employee data:", error);
  }
}

// Handle employee dropdown selection
function selectEmployee() {
  const selectedId = document.getElementById("employeeSelect").value;
  if (!selectedId) return;

  const selectedEmployee = employees.find((emp) => emp.id === selectedId);
  if (selectedEmployee) {
    document.getElementById("name").value = capitalizeName(
      selectedEmployee.name
    );
    document.getElementById("email").value = selectedEmployee.email || "";
    document.getElementById("position").value = selectedEmployee.position || "";
    document.getElementById("salary").value = selectedEmployee.salary || "";
    document.getElementById("deductions").value =
      selectedEmployee.deductions || "";
    document.getElementById("tax").value = selectedEmployee.tax || "";
    document.getElementById("employeeDropdown").innerHTML = "";
  }
}

// Update conversion rate
function updateConversionRate() {
  conversionRate = parseFloat(document.getElementById("conversionRate").value);
  localStorage.setItem("conversionRate", conversionRate);
  alert(`Conversion rate has been changed to ${conversionRate.toFixed(2)}`);
}

// Clear form
function clearForm() {
  document.getElementById("name").value = "";
  document.getElementById("email").value = "";
  document.getElementById("position").value = "";
  document.getElementById("salary").value = "";
  document.getElementById("deductions").value = "";
  document.getElementById("tax").value = "";
  document.getElementById("employeeDropdown").innerHTML = "";
}

// --- Existing Functions Upgraded ---

function generatePayslip() {
  const name = document.getElementById("name").value.trim().toLowerCase();
  const foundEmployee = employees.find(
    (employee) => employee.name.toLowerCase().trim() === name
  );
  if (!foundEmployee) {
    alert(
      "This Employee is not in the database. Please add the employee first."
    );
    return;
  }

  const email = document.getElementById("email").value;
  const position = document.getElementById("position").value;
  const salary = parseFloat(document.getElementById("salary").value);
  const deductions = parseFloat(document.getElementById("deductions").value);
  const taxPercentage = parseFloat(document.getElementById("tax").value);

  let usdPercentage =
    parseFloat(document.getElementById("usdPercentage").value) / 100 || 0.7;
  let lrdPercentage =
    parseFloat(document.getElementById("lrdPercentage").value) / 100 || 0.3;

  if (usdPercentage + lrdPercentage > 1) {
    lrdPercentage -= usdPercentage + lrdPercentage - 1;
    alert("Total percentage exceeds 100%. Adjusting LRD percentage.");
  }

  const taxAmount = (taxPercentage / 100) * salary;
  const netPayAfterDeductions = salary - taxAmount - deductions;

  const netPayUSD = netPayAfterDeductions * usdPercentage;
  const netPayLD = netPayAfterDeductions * lrdPercentage * conversionRate;

  const formattedName = capitalizeName(foundEmployee.name);

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

  clearForm();
}

function sendPayslipEmail(
  email,
  {
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
  }
) {
  if (!email) return;

  const subject = encodeURIComponent(`Your Payslip for ${month}`);
  const body = encodeURIComponent(`
Dear ${name},

Here is your payslip for ${month}:

Position: ${position}
Gross Salary: $${salary.toFixed(2)}
Income Tax: $${deductions.toFixed(2)}
Nascorp Tax: $${tax.toFixed(2)}
Net Pay in USD: $${netPayUSD.toFixed(2)}
Net Pay in LRD: $${netPayLD.toFixed(2)}
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
}

async function addEmployee() {
  const name = document.getElementById("name").value.trim().toLowerCase();
  const email = document.getElementById("email").value;
  const position = document.getElementById("position").value;
  const salary = parseFloat(document.getElementById("salary").value);
  const deductions = parseFloat(document.getElementById("deductions").value);
  const tax = parseFloat(document.getElementById("tax").value);

  try {
    const snapshot = await db
      .collection("employees")
      .where("name", "==", name)
      .get();

    if (!snapshot.empty) {
      const docId = snapshot.docs[0].id;
      await db
        .collection("employees")
        .doc(docId)
        .update({ email, position, salary, deductions, tax });
      const index = employees.findIndex((emp) => emp.id === docId);
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
      const docRef = await db
        .collection("employees")
        .add({ name, email, position, salary, deductions, tax });
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

function printPayslip() {
  const payslipContent = document.getElementById("payslip").innerHTML;
  const name = document.getElementById("name").value.trim();
  const formattedName = capitalizeName(name);
  const formattedPayslipContent = payslipContent.replace(name, formattedName);

  const printWindow = window.open("", "", "height=800,width=600");
  printWindow.document.open();
  printWindow.document.write("<html><head><title>Payslip</title>");
  printWindow.document.write(
    '<link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css" />'
  );
  printWindow.document.write(`<style>
    body { font-family: Arial, sans-serif; background-color:#f4f4f4; margin:0; padding:0; }
    .payslip { max-width:100%; margin:0; padding:20px; background:white; border:1px solid #ccc; box-shadow:0 4px 10px rgba(0,0,0,0.1); }
    .header { background-color:#002060; color:white; text-align:center; padding:10px 0; font-size:1.5rem; font-weight:bold; }
    .header img { display:block; margin:0 auto; width:70px; height:auto; }
    .payslip-section, .net-pay-section { margin-bottom:20px; }
    .net-pay-section { font-size:1.5rem; font-weight:bold; }
    .footer { margin-top:20px; text-align:center; font-size:1rem; color:#555; }
    @media print { body { background:white; } .payslip { box-shadow:none; border:none; background:white; } .btn-primary, .modal { display:none; } .header img { width:50px; height:auto; } }
  </style>`);
  printWindow.document.write("</head><body>");
  printWindow.document.write(
    `<div class="payslip">${formattedPayslipContent}</div>`
  );
  printWindow.document.write("</body></html>");
  printWindow.document.close();
  printWindow.print();
}

async function generateAllPayslips() {
  if (employees.length === 0) {
    alert("No employees found in the database!");
    return;
  }

  document.getElementById("loading-spinner").style.display = "block";
  document.getElementById("generation-completed").classList.remove("show");

  const payslipMonth =
    document.getElementById("payslipMonth").value ||
    new Date().toISOString().slice(0, 10);

  for (let i = 0; i < employees.length; i++) {
    const emp = employees[i];
    const salary = parseFloat(emp.salary) || 0;
    const deductions = parseFloat(emp.deductions) || 0;
    const taxPercentage = parseFloat(emp.tax) || 0;

    let usdPercentage =
      parseFloat(document.getElementById("usdPercentage").value) / 100 || 0.7;
    let lrdPercentage =
      parseFloat(document.getElementById("lrdPercentage").value) / 100 || 0.3;

    const taxAmount = (taxPercentage / 100) * salary;
    const netPayAfterDeductions = salary - taxAmount - deductions;
    const netPayUSD = netPayAfterDeductions * usdPercentage;
    const netPayLD = netPayAfterDeductions * lrdPercentage * conversionRate;

    sendPayslipEmail(emp.email, {
      name: capitalizeName(emp.name),
      position: emp.position,
      salary,
      deductions,
      tax: taxAmount,
      netPayUSD,
      netPayLD,
      rate: conversionRate,
      date: new Date().toLocaleDateString(),
      month: payslipMonth,
    });

    await new Promise((resolve) => setTimeout(resolve, 1000)); // avoid spamming
  }

  document.getElementById("loading-spinner").style.display = "none";
  document.getElementById("generation-completed").classList.add("show");
  alert("All payslips have been generated and emails triggered!");
}

// Prevent default context menu and F12 dev tools
document.addEventListener("contextmenu", function (e) {
  e.preventDefault();
});
document.addEventListener("keydown", function (e) {
  if (e.key === "F12" || (e.ctrlKey && e.shiftKey && e.key === "I"))
    e.preventDefault();
});
