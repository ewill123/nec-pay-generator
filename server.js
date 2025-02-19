const express = require("express");
const xlsx = require("xlsx");
const path = require("path");

const app = express();

app.get("/tax-data", (req, res) => {
  const workbook = xlsx.readFile(
    path.join(__dirname, "your-tax-calculator.xlsx")
  );
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const taxData = xlsx.utils.sheet_to_json(sheet);

  res.json(taxData);
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
