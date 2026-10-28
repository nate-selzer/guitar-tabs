// `node apply-edits.mjs <edits.json>`: writes edits pasted from the chat page ({song, edits: {barIndex: alphaTex or null}}) into song.mjs, then rebuilds.
import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';
import { updateOverrides } from './overrides.mjs';

const root = path.dirname(fileURLToPath(import.meta.url));
const { song, edits } = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const file = path.join(root, song, 'song.mjs');
if (!fs.existsSync(file)) throw new Error(`No song at ${file}`);
updateOverrides(file, edits);
for (const [index, tex] of Object.entries(edits)) console.log(`Bar ${Number(index) + 1}: ${tex === null ? 'back to the pattern' : 'edited'}`);
execFileSync(process.execPath, [path.join(root, 'build.mjs'), song, ...process.argv.slice(3)], { stdio: 'inherit' });
