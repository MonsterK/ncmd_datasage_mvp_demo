import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const filePath = path.join(__dirname, "..", "src", "App.tsx")

const source = fs.readFileSync(filePath, "utf8")

const startMarker = "// Legacy inline views (unused; kept for reference)"
const endMarker = "interface MetricProfileSheetProps {"

const startIndex = source.indexOf(startMarker)
const endIndex = source.indexOf(endMarker)

if (startIndex === -1 || endIndex === -1 || endIndex <= startIndex) {
  console.error("Legacy block markers not found or invalid. No changes applied.")
  process.exit(1)
}

const newSource = source.slice(0, startIndex) + source.slice(endIndex)

fs.writeFileSync(filePath, newSource, "utf8")
console.log("Legacy inline views block removed from App.tsx")
