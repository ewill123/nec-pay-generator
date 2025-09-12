let debounceTimer;
let employees = [];
let conversionRate = parseFloat(localStorage.getItem("conversionRate")) || 160;
let lastGeneratedPayslip = null; // store last generated payslip data

// --- EmailJS Setup ---
emailjs.init("eXeSZDtXChLe9ZJrZ"); // your public key

// Load employees on page load
window.onload = async function () {
  try {
    const snapshot = await db.collection("employees").get();
    snapshot.forEach((doc) => employees.push({ id: doc.id, ...doc.data() }));

    document.getElementById("conversionRate").value = conversionRate;

    document
      .getElementById("conversionRate")
      .addEventListener("input", updateConversionRate);

    document
      .getElementById("name")
      .addEventListener("input", debounce(fetchEmployeeData, 300));

    // Attach Send Email button
    const sendBtn = document.getElementById("sendEmailBtn");
    sendBtn.addEventListener("click", () => {
      if (!lastGeneratedPayslip) {
        alert("❌ Please generate a payslip first!");
        return;
      }
      sendPayslip(); // sends via EmailJS
    });

    generatePayslip();
  } catch (err) {
    console.error("Error fetching employees:", err);
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
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

// Fetch employees matching input
function fetchEmployeeData() {
  const enteredName = document
    .getElementById("name")
    .value.toLowerCase()
    .trim();
  if (!enteredName) return;

  const matchedEmployees = employees.filter((emp) =>
    emp.name.toLowerCase().includes(enteredName)
  );

  if (matchedEmployees.length === 1) {
    fillEmployee(matchedEmployees[0]);
    document.getElementById("employeeDropdown").innerHTML = "";
  } else if (matchedEmployees.length > 1) {
    let dropdownHTML = `<select id="employeeSelect" class="form-control mb-2" onchange="selectEmployee()"><option value="">Select Employee</option>`;
    matchedEmployees.forEach((emp) => {
      dropdownHTML += `<option value="${emp.id}">${capitalizeName(emp.name)} (${
        emp.email
      })</option>`;
    });
    dropdownHTML += `</select>`;
    document.getElementById("employeeDropdown").innerHTML = dropdownHTML;
  } else {
    document.getElementById(
      "employeeDropdown"
    ).innerHTML = `<div class="text-danger">No match found</div>`;
    document.getElementById("employeeId").value = "";
  }
}

// Fill form with selected employee
function fillEmployee(emp) {
  document.getElementById("name").value = capitalizeName(emp.name);
  document.getElementById("email").value = emp.email || "";
  document.getElementById("position").value = emp.position || "";
  document.getElementById("salary").value = emp.salary || "";
  document.getElementById("deductions").value = emp.deductions || "";
  document.getElementById("tax").value = emp.tax || "";
  document.getElementById("employeeId").value = emp.id || "";
}

// Select employee from dropdown
function selectEmployee() {
  const selectedId = document.getElementById("employeeSelect").value;
  if (!selectedId) return;
  const emp = employees.find((e) => e.id === selectedId);
  if (emp) fillEmployee(emp);
}

// Update conversion rate
function updateConversionRate() {
  conversionRate = parseFloat(document.getElementById("conversionRate").value);
  if (conversionRate <= 0) {
    alert("Conversion rate must be greater than 0");
    return;
  }
  localStorage.setItem("conversionRate", conversionRate);
  alert(`Conversion rate updated to ${conversionRate.toFixed(2)}`);
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
  document.getElementById("employeeId").value = "";
}

// Generate payslip
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

  if (salary <= 0) {
    alert("Salary must be greater than 0");
    return;
  }
  if (taxPercentage < 0 || taxPercentage > 100) {
    alert("Tax must be between 0 and 100");
    return;
  }
  if (Math.abs(usdPercentage + lrdPercentage - 1) > 0.01) {
    alert("USD + LRD percentages must equal 100%");
    return;
  }

  const taxAmount = (taxPercentage / 100) * salary;
  const netPay = salary - taxAmount - deductions;
  const netPayUSD = netPay * usdPercentage;
  const netPayLD = netPay * lrdPercentage * conversionRate;

  const payslipMonth =
    document.getElementById("payslipMonth").value ||
    new Date().toLocaleDateString();

  // Fill Payslip
  document.getElementById("payslipMonthDisplay").innerText = payslipMonth;
  document.getElementById("payslipName").innerText = capitalizeName(name);
  document.getElementById("payslipSalary").innerText = salary.toFixed(2);
  document.getElementById("payslipTax").innerText = taxAmount.toFixed(2);
  document.getElementById("payslipDeductions").innerText =
    deductions.toFixed(2);
  document.getElementById("payslipPosition").innerText =
    document.getElementById("position").value;
  document.getElementById("payslipEmail").innerText =
    document.getElementById("email").value;
  document.getElementById("payslipNetPayUSD").innerText = netPayUSD.toFixed(2);
  document.getElementById("payslipNetPayLD").innerText = netPayLD.toFixed(2);
  document.getElementById("payslipRate").innerText = conversionRate.toFixed(2);
  document.getElementById("payslipDate").innerText =
    new Date().toLocaleDateString();

  document.getElementById("payslip").classList.remove("hidden");

  // Save last generated payslip for email
  lastGeneratedPayslip = {
    name: capitalizeName(name),
    email: document.getElementById("email").value,
    position: document.getElementById("position").value,
    salary,
    deductions,
    tax: taxAmount,
    netPayUSD,
    netPayLD,
    rate: conversionRate,
    month: payslipMonth,
    date: new Date().toLocaleDateString(),
  };
}

// --- EmailJS Send Payslip ---
function sendPayslip() {
  if (!lastGeneratedPayslip) return alert("Generate a payslip first!");
  sendPayslipEmail(lastGeneratedPayslip.email, lastGeneratedPayslip);
}

function sendPayslipEmail(to_email, data) {
  if (!to_email) return alert("Employee email not set!");

  const templateParams = {
    to_email,
    name: data.name,
    position: data.position,
    salary: data.salary.toFixed(2),
    deductions: data.deductions.toFixed(2),
    tax: data.tax.toFixed(2),
    netPayUSD: data.netPayUSD.toFixed(2),
    netPayLD: data.netPayLD.toFixed(2),
    rate: data.rate.toFixed(2),
    date: data.date,
    month: data.month,
  };

  console.log("Sending email to:", to_email, templateParams);

  emailjs.send("service_fapikv8", "template_rlgylro", templateParams).then(
    (response) => {
      console.log(`Payslip sent to ${data.name} (${to_email})`);
      alert(`✅ Payslip sent to ${data.name} (${to_email})`);
    },
    (error) => {
      console.error("Failed to send email:", error);
      alert("❌ Failed to send email. Check console for details.");
    }
  );
}

// Bulk Generate All Payslips with EmailJS
async function generateAllPayslips() {
  if (!employees.length) return alert("No employees found!");
  const spinner = document.getElementById("loading-spinner");
  const progressBar = document.getElementById("progress-bar");
  const progressContainer = document.getElementById("progress-container");
  const currentEmployee = document.getElementById("current-employee");
  const completedMsg = document.getElementById("generation-completed");

  spinner.style.display = "block";
  progressContainer.style.display = "block";
  completedMsg.classList.remove("show");

  const payslipMonth =
    document.getElementById("payslipMonth").value ||
    new Date().toLocaleDateString();

  for (let i = 0; i < employees.length; i++) {
    const emp = employees[i];
    currentEmployee.innerText = `Processing: ${capitalizeName(emp.name)}`;

    const salary = parseFloat(emp.salary) || 0;
    const deductions = parseFloat(emp.deductions) || 0;
    const taxPercentage = parseFloat(emp.tax) || 0;

    const usdPercentage =
      (parseFloat(document.getElementById("usdPercentage").value) || 70) / 100;
    const lrdPercentage =
      (parseFloat(document.getElementById("lrdPercentage").value) || 30) / 100;

    const taxAmount = (taxPercentage / 100) * salary;
    const netPayAfterDeductions = salary - taxAmount - deductions;
    const netPayUSD = netPayAfterDeductions * usdPercentage;
    const netPayLD = netPayAfterDeductions * lrdPercentage * conversionRate;

    const payslipData = {
      name: capitalizeName(emp.name),
      email: emp.email,
      position: emp.position,
      salary,
      deductions,
      tax: taxAmount,
      netPayUSD,
      netPayLD,
      rate: conversionRate,
      month: payslipMonth,
      date: new Date().toLocaleDateString(),
    };

    sendPayslipEmail(emp.email, payslipData);

    progressBar.style.width = `${((i + 1) / employees.length) * 100}%`;
    progressBar.innerText = `${Math.round(
      ((i + 1) / employees.length) * 100
    )}%`;

    await new Promise((r) => setTimeout(r, 1000)); // avoid spamming
  }

  spinner.style.display = "none";
  completedMsg.classList.add("show");
  currentEmployee.innerText = "";
  alert("✅ All payslips have been sent!");
}
