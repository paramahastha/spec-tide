import fs from 'node:fs';
import path from 'node:path';
export function probeTestCommand(root: string) {
  const p = path.join(root, 'package.json');
  if (!fs.existsSync(p))
    return {
      subject: 'test-command',
      result: 'needs_setup',
      observed_version: null,
      message: 'No package manifest was found.',
      next_action: 'Configure a test command appropriate for this project.',
    };
  try {
    const j = JSON.parse(fs.readFileSync(p, 'utf8'));
    const ready = typeof j.scripts?.test === 'string';
    return {
      subject: 'test-command',
      result: ready ? 'unverified' : 'needs_setup',
      observed_version: null,
      message: ready
        ? 'A test script is configured but was not executed.'
        : 'No test script is configured.',
      next_action: ready
        ? 'Run the project test command explicitly.'
        : 'Add a test script if this project uses automated tests.',
    };
  } catch {
    return {
      subject: 'test-command',
      result: 'unverified',
      observed_version: null,
      message: 'The package manifest could not be safely parsed.',
      next_action: 'Review the project manifest.',
    };
  }
}
