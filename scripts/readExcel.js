const XLSX = require("xlsx");
const path = require("path");

function checkPriorityAcrossSheets() {
  const filePath = "C:\\Users\\puska\\Downloads\\diet_chart_allergy_cleaned_no_legume_pulse_coconut_FINAL.xlsx";
  const absPath = path.resolve(filePath);
  const wb = XLSX.readFile(absPath);

  wb.SheetNames.forEach(sheetName => {
    const ws = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(ws, { defval: "" });
    if (rows.length === 0) return;

    const cols = Object.keys(rows[0]);
    const priorityCols = cols.filter(k => k.toLowerCase().includes("priority"));
    
    if (priorityCols.length > 0) {
      const colName = priorityCols[0];
      const countYes = rows.filter(r => String(r[colName]).trim().toLowerCase() === "yes").length;
      console.log(`Sheet "${sheetName}" HAS priority column "${colName}". Total rows with "Yes": ${countYes}/${rows.length}`);
    } else {
      console.log(`Sheet "${sheetName}" does NOT have a priority column.`);
    }
  });
}

checkPriorityAcrossSheets();
