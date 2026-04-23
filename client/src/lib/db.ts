import initSqlJs, { type Database } from 'sql.js';
import { get, set } from 'idb-keyval';

let db: Database | null = null;

export const initDB = async () => {
  if (db) return db;
  const SQL = await initSqlJs({
    locateFile: file => {
      if (file.endsWith('.wasm')) return '/sql-wasm.wasm';
      return `/${file}`;
    }
  });

  const savedData = await get('cartsan_db_v2');
  if (savedData) {
    db = new SQL.Database(savedData);
  } else {
    db = new SQL.Database();
    createTables(db);
    await saveDB();
  }
  return db;
};

const createTables = (database: Database) => {
  database.run(`
    CREATE TABLE IF NOT EXISTS companies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ragione_sociale TEXT NOT NULL,
      p_iva TEXT,
      codice_fiscale TEXT,
      ateco TEXT,
      sede_legale TEXT,
      sede_operativa TEXT,
      referente TEXT,
      rspp TEXT,
      rls TEXT
    );

    CREATE TABLE IF NOT EXISTS workers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id INTEGER,
      nome TEXT NOT NULL,
      cognome TEXT NOT NULL,
      codice_fiscale TEXT UNIQUE,
      data_nascita DATE,
      luogo_nascita TEXT,
      sesso TEXT,
      mansione TEXT,
      data_assunzione DATE,
      rischi TEXT, -- JSON string
      FOREIGN KEY (company_id) REFERENCES companies(id)
    );

    CREATE TABLE IF NOT EXISTS protocols (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id INTEGER,
      mansione TEXT,
      esami TEXT, -- JSON string
      periodicita_mesi INTEGER,
      FOREIGN KEY (company_id) REFERENCES companies(id)
    );

    CREATE TABLE IF NOT EXISTS visits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      worker_id INTEGER,
      data_visita DATE,
      tipo_visita TEXT, -- preventiva, periodica, etc.
      anamnesi_lavorativa TEXT,
      anamnesi_familiare TEXT,
      anamnesi_patologica TEXT,
      esame_obiettivo TEXT,
      giudizio TEXT,
      prescrizioni TEXT,
      scadenza_prossima DATE,
      medico_id INTEGER,
      FOREIGN KEY (worker_id) REFERENCES workers(id)
    );

    CREATE TABLE IF NOT EXISTS biometrics (
      visit_id INTEGER PRIMARY KEY,
      peso REAL,
      altezza INTEGER,
      pressione_sistolica INTEGER,
      pressione_diastolica INTEGER,
      frequenza_cardiaca INTEGER,
      bmi REAL,
      FOREIGN KEY (visit_id) REFERENCES visits(id)
    );

    CREATE TABLE IF NOT EXISTS doctor_profile (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      nome TEXT,
      specializzazione TEXT,
      n_iscrizione TEXT,
      timbro_immagine TEXT -- Base64
    );
  `);
};

export const saveDB = async () => {
  if (!db) return;
  const data = db.export();
  await set('cartsan_db_v2', data);
};

export const getDB = () => db;

export const executeQuery = (sql: string, params?: any[]) => {
  if (!db) throw new Error("Database non inizializzato");
  const result = db.exec(sql, params);
  if (result.length === 0) return [];

  const columns = result[0].columns;
  return result[0].values.map(row => {
    const obj: any = {};
    columns.forEach((col, i) => {
      obj[col] = row[i];
    });
    return obj;
  });
};

export const runCommand = async (sql: string, params?: any[]) => {
  if (!db) throw new Error("Database non inizializzato");
  db.run(sql, params);
  await saveDB();
};
