import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { isWithin } from '../../../packages/core/src/path-boundary.js';
describe('path boundaries', () => {
  it('refuses a symlink escape', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'spectide-root-'));
    const outside = fs.mkdtempSync(path.join(os.tmpdir(), 'spectide-outside-'));
    const link = path.join(root, 'escape');
    fs.symlinkSync(outside, link, 'dir');
    expect(isWithin(root, link)).toBe(false);
    fs.rmSync(root, { recursive: true, force: true });
    fs.rmSync(outside, { recursive: true, force: true });
  });
  it('contains descendants and rejects siblings', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'spectide-boundary-'));
    const child = path.join(root, 'child');
    fs.mkdirSync(child);
    expect(isWithin(root, child)).toBe(true);
    expect(isWithin(child, root)).toBe(false);
    fs.rmSync(root, { recursive: true, force: true });
  });
});
