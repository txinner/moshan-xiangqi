import {DatabaseSync} from 'node:sqlite';
import {mkdirSync,readFileSync,readdirSync,existsSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
export function openLocalDatabase(filename=resolve('.moshan-data/rooms.sqlite')){
  if(filename!==':memory:')mkdirSync(dirname(filename),{recursive:true});
  const sqlite=new DatabaseSync(filename);sqlite.exec('PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;');
  const migrations=fileURLToPath(new URL('../drizzle/',import.meta.url));
  // A fresh local database uses the same immutable schema as hosted D1.
  sqlite.exec('CREATE TABLE IF NOT EXISTS local_migrations (name TEXT PRIMARY KEY)');
  if(existsSync(migrations))for(const name of readdirSync(migrations).filter(n=>n.endsWith('.sql')).sort()){
    if(!sqlite.prepare('SELECT name FROM local_migrations WHERE name=?').get(name)){
      sqlite.exec('BEGIN');try{sqlite.exec(readFileSync(resolve(migrations,name),'utf8'));sqlite.prepare('INSERT INTO local_migrations (name) VALUES (?)').run(name);sqlite.exec('COMMIT');}catch(err){sqlite.exec('ROLLBACK');throw err;}
    }
  }
  return {prepare(sql){let values=[];const query={bind(...args){values=args;return query;},async first(){return sqlite.prepare(sql).get(...values)||null;},async all(){return {results:sqlite.prepare(sql).all(...values)};},async run(){return {meta:{changes:Number(sqlite.prepare(sql).run(...values).changes)}};}};return query;},close(){sqlite.close();}};
}
