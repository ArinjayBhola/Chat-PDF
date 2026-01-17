import "dotenv/config";
import { generateSummaryAndQuestions } from "../lib/summary-service";

async function main() {
  const fileKey = "uploads/1768454217222IndiaRussia25new.pdf";
  console.log("Testing generation for:", fileKey);
  
  const result = await generateSummaryAndQuestions(fileKey);
  
  console.log("--------------------------------");
  console.log("Summary:", result.summary);
  console.log("Questions:", result.suggestedQuestions);
  console.log("--------------------------------");
}

main().catch(console.error);
