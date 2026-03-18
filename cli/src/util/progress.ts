import ora, { type Ora } from "ora";

let spinner: Ora | null = null;
let jsonMode = false;

export function setJsonMode(json: boolean): void {
  jsonMode = json;
}

export function startSpinner(text: string): void {
  if (jsonMode) return;
  spinner = ora(text).start();
}

export function updateSpinner(text: string): void {
  if (spinner) spinner.text = text;
}

export function succeedSpinner(text?: string): void {
  if (spinner) {
    spinner.succeed(text);
    spinner = null;
  }
}

export function failSpinner(text?: string): void {
  if (spinner) {
    spinner.fail(text);
    spinner = null;
  }
}

export function stopSpinner(): void {
  if (spinner) {
    spinner.stop();
    spinner = null;
  }
}
