// `npm run package-skill [zip]`: packs the chat skill (SKILL.md = chat.md + SKILL.md's Lyrics and Writing sections) into ~/Downloads/guitar-tab-chat.zip.
import fs from 'fs';
import os from 'os';
import path from 'path';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';

const root = path.dirname(fileURLToPath(import.meta.url));
const out = path.resolve(process.argv[2] ?? path.join(os.homedir(), 'Downloads', 'guitar-tab-chat.zip'));
const FILES = [
  'build.mjs', 'chords.mjs', 'overrides.mjs', 'apply-edits.mjs',
  'templates/tab.html', 'templates/chords.html', 'templates/home.html',
  'web/playback.js', 'web/editor.js', 'web/diagram.js', 'web/chart-editor.js',
  'vendor/alphatab/alphaTab.min.js', 'vendor/alphatab/alphaTab.core.min.mjs',
  'vendor/alphatab/font/Bravura.woff2', 'vendor/alphatab/soundfont/sonivox.sf2.b64.txt',
];

const skillDir = path.join(root, '.claude/skills/guitar-tab');
const main = fs.readFileSync(path.join(skillDir, 'SKILL.md'), 'utf8');
const section = heading => main.slice(main.indexOf(heading), main.indexOf('\n## ', main.indexOf(heading) + 1)).trim();
const shared = ['## Lyrics', '## Writing `<slug>/song.mjs`'].map(section).join('\n\n').split('\n').filter(l => !l.startsWith('- In the repo')).join('\n');

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'guitar-tab-chat-'));
const dir = path.join(tmp, 'guitar-tab-chat');
for (const f of FILES) {
  fs.mkdirSync(path.dirname(path.join(dir, f)), { recursive: true });
  fs.copyFileSync(path.join(root, f), path.join(dir, f));
}
fs.writeFileSync(path.join(dir, 'SKILL.md'), fs.readFileSync(path.join(skillDir, 'chat.md'), 'utf8').trimEnd() + '\n\n' + shared + '\n');
fs.rmSync(out, { force: true });
execFileSync('zip', ['-qrX', out, 'guitar-tab-chat'], { cwd: tmp });
fs.rmSync(tmp, { recursive: true });
console.log(`${out} (${(fs.statSync(out).size / 1e6).toFixed(1)} MB). Upload it in claude.ai under Skills, replacing the old one.`);
