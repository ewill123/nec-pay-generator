import emailjs from "@emailjs/browser"; // use browser version on server too

export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ message: "Method not allowed" });

  try {
    const {
      name,
      email,
      position,
      salary,
      deductions,
      tax,
      usdPercentage,
      lrdPercentage,
      conversionRate,
      month,
    } = req.body;

    // --- Sensitive calculations server-side ---
    const taxAmount = (tax / 100) * salary;
    const netPay = salary - taxAmount - deductions;
    const netPayUSD = netPay * (usdPercentage / 100);
    const netPayLD = netPay * (lrdPercentage / 100) * conversionRate;

    // --- Email sending ---
    await emailjs.send("service_fapikv8", "template_rlgylro", {
      to_email: email,
      name,
      email,
      position,
      date: new Date().toLocaleDateString(),
      salary: salary.toFixed(2),
      deductions: deductions.toFixed(2),
      tax: taxAmount.toFixed(2),
      netPayUSD: netPayUSD.toFixed(2),
      netPayLD: netPayLD.toFixed(2),
      month,
      title: `Payslip for ${month}`,
    });

    res.status(200).json({
      message: "Payslip generated and sent successfully",
      payslip: { name, taxAmount, netPay, netPayUSD, netPayLD },
    });
  } catch (error) {
    console.error("Server Error:", error);
    res.status(500).json({ message: "Failed to generate payslip", error });
  }
}
