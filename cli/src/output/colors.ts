import chalk from "chalk";
import type { Severity, Grade } from "@/lib/types";

export function severityColor(severity: Severity): (text: string) => string {
  switch (severity) {
    case "critical":
      return chalk.red;
    case "high":
      return chalk.hex("#f97316");
    case "medium":
      return chalk.yellow;
    case "low":
      return chalk.blue;
    case "good":
      return chalk.green;
    default:
      return chalk.white;
  }
}

export function severityLabel(severity: Severity): string {
  const label = severity.toUpperCase().padEnd(8);
  return severityColor(severity)(label);
}

export function gradeColor(grade: Grade): (text: string) => string {
  switch (grade) {
    case "A+":
      return chalk.green;
    case "B":
      return chalk.blue;
    case "C":
      return chalk.yellow;
    case "D":
      return chalk.hex("#f97316");
    case "F":
      return chalk.red;
    default:
      return chalk.white;
  }
}

export function formatGrade(grade: Grade): string {
  return gradeColor(grade)(grade);
}

export function formatScore(score: number, grade: Grade): string {
  return gradeColor(grade)(`${score}/100`);
}

export function dim(text: string): string {
  return chalk.dim(text);
}

export function bold(text: string): string {
  return chalk.bold(text);
}

export function header(text: string): string {
  return chalk.bold.white(text);
}
