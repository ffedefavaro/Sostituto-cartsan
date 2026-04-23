import React, { useState, useEffect } from 'react';
import { executeQuery, runCommand, getDB, saveDB } from '../lib/db';
import { User, Shield, Database, Save, Upload, Trash2, Download } from 'lucide-react';

const Settings = () => {
  const [doctor, setDoctor] = useState({
    nome: '',
    specializzazione: '',
    n_iscrizione: '',
    timbro_immagine: ''
  });

  useEffect(() => {
    const data = executeQuery("SELECT * FROM doctor_profile WHERE id = 1");
    if (data.length > 0) {
      setDoctor(data[0]);
    }
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const exists = executeQuery("SELECT id FROM doctor_profile WHERE id = 1");
    if (exists.length > 0) {
      await runCommand(
        "UPDATE doctor_profile SET nome = ?, specializzazione = ?, n_iscrizione = ?, timbro_immagine = ? WHERE id = 1",
        [doctor.nome, doctor.specializzazione, doctor.n_iscrizione, doctor.timbro_immagine]
      );
    } else {
      await runCommand(
        "INSERT INTO doctor_profile (id, nome, specializzazione, n_iscrizione, timbro_immagine) VALUES (1, ?, ?, ?, ?)",
        [doctor.nome, doctor.specializzazione, doctor.n_iscrizione, doctor.timbro_immagine]
      );
    }
    alert("Profilo Medico salvato!");
  };

  const handleExportDB = () => {
    const db = getDB();
    if (!db) return;
    const data = db.export();
    const blob = new Blob([data.buffer], { type: 'application/x-sqlite3' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cartsan_backup_${new Date().toISOString().split('T')[0]}.sqlite`;
    a.click();
  };

  const handleImportDB = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function() {
      const uint8Array = new Uint8Array(this.result as ArrayBuffer);
      localStorage.setItem('cartsan_db', JSON.stringify(Array.from(uint8Array)));
      window.location.reload();
    };
    reader.readAsArrayBuffer(file);
  };

  const clearDB = () => {
    if (confirm("ATTENZIONE: Questa operazione eliminerà TUTTI i dati permanentemente. Procedere?")) {
      localStorage.removeItem('cartsan_db');
      window.location.reload();
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2 mb-8">
        <Shield className="text-blue-600" /> Impostazioni e Sicurezza
      </h1>

      <div className="space-y-8">
        {/* Doctor Profile */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-gray-50 border-b border-gray-200 font-semibold flex items-center gap-2">
            <User size={18} className="text-blue-500" /> Profilo Medico Competente
          </div>
          <form onSubmit={handleSaveProfile} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1 col-span-full">
              <label className="text-sm font-medium text-gray-600">Nome e Cognome</label>
              <input
                className="border rounded-md p-2"
                value={doctor.nome}
                onChange={e => setDoctor({...doctor, nome: e.target.value})}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-600">Specializzazione</label>
              <input
                className="border rounded-md p-2"
                value={doctor.specializzazione}
                onChange={e => setDoctor({...doctor, specializzazione: e.target.value})}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-600">N. Iscrizione Ordine</label>
              <input
                className="border rounded-md p-2"
                value={doctor.n_iscrizione}
                onChange={e => setDoctor({...doctor, n_iscrizione: e.target.value})}
              />
            </div>
            <div className="col-span-full flex justify-end">
              <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700">
                <Save size={18} /> Salva Profilo
              </button>
            </div>
          </form>
        </div>

        {/* Database Management */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-gray-50 border-b border-gray-200 font-semibold flex items-center gap-2">
            <Database size={18} className="text-green-500" /> Gestione Dati e Backup
          </div>
          <div className="p-6 flex flex-wrap gap-4">
            <button
              onClick={handleExportDB}
              className="flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-lg border border-green-200 hover:bg-green-100"
            >
              <Download size={18} /> Esporta Backup (.sqlite)
            </button>

            <label className="flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-lg border border-blue-200 hover:bg-blue-100 cursor-pointer">
              <Upload size={18} /> Importa Database
              <input type="file" className="hidden" accept=".sqlite" onChange={handleImportDB} />
            </label>

            <button
              onClick={clearDB}
              className="flex items-center gap-2 bg-red-50 text-red-700 px-4 py-2 rounded-lg border border-red-200 hover:bg-red-100 ml-auto"
            >
              <Trash2 size={18} /> Elimina Tutti i Dati
            </button>
          </div>
          <div className="px-6 pb-6 text-xs text-gray-400">
            I dati vengono salvati automaticamente nel browser. Si consiglia di effettuare un backup regolare per evitare perdite di dati in caso di pulizia della cache.
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
