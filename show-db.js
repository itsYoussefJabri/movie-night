import Database from 'better-sqlite3';
const db = new Database('server/movienight.db');

console.log('=== DATABASE TABLES ===\n');

const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();

tables.forEach(t => {
  console.log(`TABLE: ${t.name}`);
  const cols = db.prepare(`PRAGMA table_info(${t.name})`).all();
  cols.forEach(c => {
    let info = `  ${c.name} (${c.type})`;
    if (c.pk) info += ' PRIMARY KEY';
    if (c.notnull) info += ' NOT NULL';
    if (c.dflt_value) info += ` DEFAULT ${c.dflt_value}`;
    console.log(info);
  });
  const count = db.prepare(`SELECT COUNT(*) as n FROM ${t.name}`).get();
  console.log(`  -> ${count.n} rows\n`);
});

console.log('=== REGISTRATIONS DATA ===');
const regs = db.prepare('SELECT * FROM registrations').all();
if (regs.length) {
  regs.forEach(r => console.log(JSON.stringify(r, null, 2)));
} else {
  console.log('  (empty)');
}

console.log('\n=== ATTENDEES DATA ===');
const atts = db.prepare('SELECT * FROM attendees').all();
if (atts.length) {
  atts.forEach(a => console.log(JSON.stringify(a, null, 2)));
} else {
  console.log('  (empty)');
}

db.close();
