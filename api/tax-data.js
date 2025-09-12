import xlsx from "xlsx";
import path from "path";
import { fileURLToPath } from "url";

// For __dirname replacement in ESM modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default function handler(req, res) {
  try {
    // Adjust the path if your Excel file is in the root
    const workbook = xlsx.readFile(
      path.join(__dirname, "../your-tax-calculator.xlsx")
    );
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const taxData = xlsx.utils.sheet_to_json(sheet);

    res.status(200).json(taxData);
  } catch (error) {
    console.error("Error reading Excel:", error);
    res.status(500).json({ error: "Failed to read tax data" });
  }
}
