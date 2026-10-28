// `node apply-edits.mjs <edits.json>`: writes edits pasted from the chat page ({song, edits: {barIndex: alphaTex or null}, chords: {name: chart fields or null}}) into song.mjs, then rebuilds.
import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';
import { updateEdits } from './overrides.mjs';

const root = path.dirname(fileURLToPath(import.meta.url));
const { song, edits = {}, chords = {} } = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const file = path.join(root, song, 'song.mjs');
if (!fs.existsSync(file)) throw new Error(`No song at ${file}`);
updateEdits(file, 'overrides', edits);
updateEdits(file, 'chordEdits', chords);
for (const [index, tex] of Object.entries(edits)) console.log(`Bar ${Number(index) + 1}: ${tex === null ? 'back to the pattern' : 'edited'}`);
for (const [name, chart] of Object.entries(chords)) console.log(`${name} chart: ${chart === null ? 'back to the song\'s shape' : 'edited'}`);
execFileSync(process.execPath, [path.join(root, 'build.mjs'), song, ...process.argv.slice(3)], { stdio: 'inherit' });
