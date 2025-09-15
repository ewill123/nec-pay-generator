// ============================
// NEC Payslip Generator Script
// ============================

let debounceTimer;
let employees = [];
let conversionRate = parseFloat(localStorage.getItem("conversionRate")) || 160;
let lastGeneratedPayslip = null; // Store last generated payslip data

// --- EmailJS Setup ---
emailjs.init("eXeSZDtXChLe9ZJrZ"); // Replace with your public key

// --- Load employees on page load ---
window.addEventListener("DOMContentLoaded", async () => {
  await loadEmployees();

  // Set conversion rate input
  document.getElementById("conversionRate").value = conversionRate;

  // Event listeners
  document
    .getElementById("conversionRate")
    .addEventListener("input", updateConversionRate);
  document
    .getElementById("name")
    .addEventListener("input", debounce(fetchEmployeeData, 300));

  document
    .getElementById("name")
    .addEventListener("blur", () =>
      setTimeout(
        () =>
          document.getElementById("employeeDropdown").classList.add("hidden"),
        200
      )
    );

  document
    .getElementById("sendEmailBtn")
    .addEventListener("click", async () => {
      if (!lastGeneratedPayslip)
        return alert("❌ Please generate a payslip first!");
      await sendPayslip();
    });
});

// --- Utilities ---
function debounce(func, delay) {
  return function (...args) {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => func.apply(this, args), delay);
  };
}

function capitalizeName(name) {
  return name
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

// ============================
// Employee CRUD Functions
// ============================

async function loadEmployees() {
  try {
    employees = [];
    const snapshot = await db.collection("employees").get();
    snapshot.forEach((doc) => employees.push({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error loading employees:", error);
  }
}

// --- Autocomplete / Dropdown ---
// --- Autocomplete / Dropdown ---
function fetchEmployeeData() {
  const enteredName = document
    .getElementById("name")
    .value.toLowerCase()
    .trim();
  const dropdown = document.getElementById("employeeDropdown");
  dropdown.innerHTML = "";

  if (!enteredName) return dropdown.classList.add("hidden");

  // Filter matching employees
  const matchedEmployees = employees.filter((emp) =>
    emp.name.toLowerCase().includes(enteredName)
  );

  if (matchedEmployees.length === 0) {
    dropdown.innerHTML = `<div class="text-danger px-2 py-1">No match found</div>`;
    document.getElementById("employeeId").value = "";
    dropdown.classList.remove("hidden");
  } else if (matchedEmployees.length === 1) {
    // Auto-fill if there's only one exact match
    const emp = matchedEmployees[0];
    if (emp.name.toLowerCase() === enteredName) {
      fillEmployee(emp);
      dropdown.classList.add("hidden");
      return;
    }
    // Otherwise, still show dropdown
    showDropdown(matchedEmployees);
  } else {
    showDropdown(matchedEmployees);
  }
}

// --- Helper to show dropdown ---
function showDropdown(employeesList) {
  const dropdown = document.getElementById("employeeDropdown");
  dropdown.innerHTML = ""; // Clear previous items

  employeesList.forEach((emp) => {
    const div = document.createElement("div");
    div.textContent = `${capitalizeName(emp.name)} (${emp.email})`;
    div.className = "dropdown-item px-2 py-1"; // Add minimal styling
    div.onclick = () => fillEmployee(emp);
    dropdown.appendChild(div);
  });

  dropdown.classList.remove("hidden");
}

// --- Optional: Hide dropdown when clicking outside ---
document.addEventListener("click", (e) => {
  const dropdown = document.getElementById("employeeDropdown");
  const nameInput = document.getElementById("name");
  if (!dropdown.contains(e.target) && e.target !== nameInput) {
    dropdown.classList.add("hidden");
  }
});

function fillEmployee(emp) {
  document.getElementById("name").value = capitalizeName(emp.name);
  document.getElementById("email").value = emp.email || "";
  document.getElementById("position").value = emp.position || "";
  document.getElementById("salary").value = emp.salary || "";
  document.getElementById("deductions").value = emp.deductions || "";
  document.getElementById("tax").value = emp.tax || "";
  document.getElementById("employeeId").value = emp.id || "";
  document.getElementById("employeeDropdown").classList.add("hidden");
}

// --- Add / Update Employee ---
async function addOrUpdateEmployee() {
  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const position = document.getElementById("position").value.trim();
  const salary = parseFloat(document.getElementById("salary").value) || 0;
  const deductions =
    parseFloat(document.getElementById("deductions").value) || 0;
  const tax = parseFloat(document.getElementById("tax").value) || 0;

  if (!name || !email) return alert("Name and Email are required!");

  const employeeId = document.getElementById("employeeId").value;

  try {
    if (employeeId) {
      await db
        .collection("employees")
        .doc(employeeId)
        .set(
          { name, email, position, salary, deductions, tax },
          { merge: true }
        );
      alert("✅ Employee updated successfully!");
    } else {
      await db
        .collection("employees")
        .add({ name, email, position, salary, deductions, tax });
      alert("✅ Employee added successfully!");
    }
    clearForm();
    await loadEmployees();
  } catch (error) {
    console.error("Error saving employee:", error);
    alert("❌ Failed to save employee");
  }
}

// --- Delete Employee ---
async function deleteEmployee() {
  const employeeId = document.getElementById("employeeId").value;
  if (!employeeId) return alert("Please select an employee to delete first.");
  if (!confirm("Are you sure you want to delete this employee?")) return;

  try {
    await db.collection("employees").doc(employeeId).delete();
    alert("✅ Employee deleted successfully!");
    clearForm();
    await loadEmployees();
  } catch (error) {
    console.error("Error deleting employee:", error);
    alert("❌ Failed to delete employee.");
  }
}

// ============================
// Conversion Rate
// ============================

function updateConversionRate() {
  conversionRate = parseFloat(document.getElementById("conversionRate").value);
  if (conversionRate <= 0)
    return alert("Conversion rate must be greater than 0");
  localStorage.setItem("conversionRate", conversionRate);
  alert(`Conversion rate updated to ${conversionRate.toFixed(2)}`);
}

// ============================
// Form Handling
// ============================

function clearForm() {
  document.getElementById("payslipForm").reset();
  lastGeneratedPayslip = null;
  document.getElementById("payslip").classList.add("hidden");
  hideLoading();
  document.getElementById("employeeDropdown").innerHTML = "";
  document.getElementById("employeeId").value = "";
}

// ============================
// Payslip Generation
// ============================

function generatePayslip() {
  const name = document.getElementById("name").value.trim();
  if (!name) return;

  const salary = parseFloat(document.getElementById("salary").value) || 0;
  const deductions =
    parseFloat(document.getElementById("deductions").value) || 0;
  const taxPercentage = parseFloat(document.getElementById("tax").value) || 0;
  const usdPercentage =
    (parseFloat(document.getElementById("usdPercentage").value) || 70) / 100;
  const lrdPercentage =
    (parseFloat(document.getElementById("lrdPercentage").value) || 30) / 100;

  if (salary <= 0) return alert("Salary must be greater than 0");
  if (taxPercentage < 0 || taxPercentage > 100)
    return alert("Tax must be between 0 and 100");
  if (Math.abs(usdPercentage + lrdPercentage - 1) > 0.01)
    return alert("USD + LRD percentages must equal 100%");

  const taxAmount = (taxPercentage / 100) * salary;
  const netPay = salary - taxAmount - deductions;
  const netPayUSD = netPay * usdPercentage;
  const netPayLD = netPay * lrdPercentage * conversionRate;

  const payslipMonth =
    document.getElementById("payslipMonth").value ||
    new Date().toLocaleDateString();

  const mapping = {
    payslipMonthDisplay: payslipMonth,
    payslipName: capitalizeName(name),
    payslipSalary: salary.toFixed(2),
    payslipTax: taxAmount.toFixed(2),
    payslipDeductions: deductions.toFixed(2),
    payslipPosition: document.getElementById("position").value,
    payslipEmail: document.getElementById("email").value,
    payslipNetPayUSD: netPayUSD.toFixed(2),
    payslipNetPayLD: netPayLD.toFixed(2),
    payslipRate: conversionRate.toFixed(2),
    payslipDate: new Date().toLocaleDateString(),
  };

  // Update payslip HTML
  Object.keys(mapping).forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.innerText = mapping[id];
  });

  // Show the payslip
  document.getElementById("payslip").classList.remove("hidden");

  // Save last generated payslip
  lastGeneratedPayslip = { ...mapping };

  // Clear form while keeping payslip visible
  const form = document.getElementById("payslipForm");
  form.reset();
  document.getElementById("employeeDropdown").innerHTML = "";
  document.getElementById("employeeId").value = "";
}

// ============================
// Spinner / Progress
// ============================

function showLoading(employeeName) {
  document.getElementById("loading-spinner").classList.remove("hidden");
  document.getElementById("progress-container").classList.remove("hidden");
  document.getElementById(
    "current-employee"
  ).innerText = `Sending to: ${employeeName}`;
}

function updateProgress(percent) {
  const bar = document.getElementById("progress-bar");
  bar.style.width = percent + "%";
  bar.innerText = percent + "%";
}

function hideLoading() {
  document.getElementById("loading-spinner").classList.add("hidden");
  document.getElementById("progress-container").classList.add("hidden");
  document.getElementById("current-employee").innerText = "";
}

// ============================
// Email Sending
// ============================

async function sendPayslipEmail(to_email, data, showAlert = true) {
  if (!to_email) return;
  showLoading(data.payslipName);

  const templateParams = {
    to_email: data.payslipEmail,
    name: data.payslipName,
    email: data.payslipEmail,
    month: data.payslipMonthDisplay,
    position: data.payslipPosition,
    date: data.payslipDate,
    rate: data.payslipRate,
    salary: data.payslipSalary,
    deductions: data.payslipDeductions,
    tax: data.payslipTax,
    netPayUSD: data.payslipNetPayUSD,
    netPayLD: data.payslipNetPayLD,
    title: `Payslip for ${data.payslipMonthDisplay}`,
  };

  try {
    await emailjs.send("service_fapikv8", "template_rlgylro", templateParams);
    if (showAlert) alert(`✅ Payslip sent to ${data.payslipName}`);
  } catch (error) {
    console.error("Failed to send email to", data.payslipName, error);
    if (showAlert) alert(`❌ Failed to send email to ${data.payslipName}`);
  } finally {
    hideLoading();
  }
}

async function sendPayslip() {
  if (!lastGeneratedPayslip) return alert("❌ Generate a payslip first!");
  await sendPayslipEmail(
    lastGeneratedPayslip.payslipEmail,
    lastGeneratedPayslip
  );
}

async function sendPayslipsToAll() {
  const filteredEmployees = employees.filter((e) => e.email);
  if (filteredEmployees.length === 0)
    return alert("No employees with email to send.");

  for (let i = 0; i < filteredEmployees.length; i++) {
    const emp = filteredEmployees[i];
    updateProgress(Math.round(((i + 1) / filteredEmployees.length) * 100));
    document.getElementById(
      "current-employee"
    ).innerText = `Sending to: ${emp.name}`;

    const taxAmount = (emp.tax / 100) * emp.salary;
    const netPay = emp.salary - taxAmount - emp.deductions;
    const usdPercentage =
      (parseFloat(document.getElementById("usdPercentage").value) || 70) / 100;
    const lrdPercentage =
      (parseFloat(document.getElementById("lrdPercentage").value) || 30) / 100;
    const netPayUSD = netPay * usdPercentage;
    const netPayLD = netPay * lrdPercentage * conversionRate;

    const data = {
      payslipName: emp.name,
      payslipPosition: emp.position,
      payslipSalary: emp.salary.toFixed(2),
      payslipDeductions: emp.deductions.toFixed(2),
      payslipTax: taxAmount.toFixed(2),
      payslipNetPayUSD: netPayUSD.toFixed(2),
      payslipNetPayLD: netPayLD.toFixed(2),
      payslipRate: conversionRate.toFixed(2),
      payslipDate: new Date().toLocaleDateString(),
      payslipMonthDisplay:
        document.getElementById("payslipMonth").value ||
        new Date().toLocaleDateString(),
      payslipEmail: emp.email,
    };

    await sendPayslipEmail(emp.email, data, false);
  }

  alert("✅ All payslips sent successfully!");
  hideLoading();
}

// ============================
// Logout
// ============================

function logoutUser() {
  if (firebase && firebase.auth) {
    firebase
      .auth()
      .signOut()
      .then(() => {
        alert("Logged out successfully.");
        window.location.href = "login.html";
      })
      .catch((error) => {
        console.error("Logout Error:", error);
        alert("Error logging out.");
      });
  } else alert("Firebase not initialized correctly!");
}

// ============================
// Print Payslip
// ============================

function printPayslip() {
  const payslip = document.getElementById("payslip");
  if (!payslip) return alert("No payslip to print!");
  const printWindow = window.open("", "_blank", "width=800,height=600");
  printWindow.document.write(`
    <html>
      <head>
        <title>Print Payslip</title>
        <style>
          body { font-family:"Segoe UI", Tahoma, Geneva, Verdana, sans-serif; padding:20px; color:#333; }
          #payslip { padding:20px; border-radius:15px; background:#fff; box-shadow:0 5px 15px rgba(0,0,0,0.15);}
          h2,h4{text-align:center;} hr{margin:15px 0;} p{margin:4px 0;}
        </style>
      </head>
      <body>${payslip.innerHTML}</body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
  printWindow.close();
}
