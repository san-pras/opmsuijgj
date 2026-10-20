import React, { useState, useEffect, useRef } from 'react';
import { Settings, LogOut, GripVertical, Trash2, Edit2, Check, X, ArrowRight, ArrowUp, ArrowDown, Calendar, Mic } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, onSnapshot } from 'firebase/firestore';

// --- Firebase Initialization ---
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'open-mic-app';

const DEFAULT_STATE = {
  date: '',
  quota: 10,
  mc1: '',
  mc2: '',
  mainList: [],
  waitingList: []
};

export default function App() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  
  const [appData, setAppData] = useState(DEFAULT_STATE);
  const [isLoading, setIsLoading] = useState(true);

  // --- Auth & Data Fetching ---
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.error("Auth error:", err);
      }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'state', 'current');
    
    const unsubscribe = onSnapshot(docRef, 
      (docSnap) => {
        if (docSnap.exists()) {
          setAppData(docSnap.data());
        } else {
          // Initialize if not exists
          setDoc(docRef, DEFAULT_STATE);
          setAppData(DEFAULT_STATE);
        }
        setIsLoading(false);
      },
      (error) => {
        console.error("Firestore error:", error);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // --- Data Mutation ---
  const updateData = async (newData) => {
    if (!user) return;
    const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'state', 'current');
    await setDoc(docRef, newData);
  };

  // --- Handlers ---
  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (pinInput === '1234') {
      setIsAdmin(true);
      setShowPinModal(false);
      setPinInput('');
      setPinError(false);
    } else {
      setPinError(true);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center font-sans text-black">
        <p className="animate-pulse text-xl font-bold tracking-widest uppercase">Memuat Jadwal...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans flex justify-center">
      <div className="w-full max-w-3xl min-h-screen border-x-2 border-black flex flex-col">
        
        {/* Header */}
        <header className="border-b-2 border-black p-6 bg-black text-white flex justify-between items-center sticky top-0 z-10 shadow-md">
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tighter">Open Mic Standupindo Jogja</h1>
            <p className="text-gray-400 text-sm tracking-widest mt-1">MANAGEMENT SYSTEM</p>
          </div>
          <button 
            onClick={() => isAdmin ? setIsAdmin(false) : setShowPinModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white text-black font-bold text-sm border-2 border-transparent hover:border-white hover:bg-black hover:text-white transition-all rounded-sm"
          >
            {isAdmin ? (
              <><LogOut size={16} /> EXIT ADMIN</>
            ) : (
              <><Settings size={16} /> ADMIN</>
            )}
          </button>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-6 sm:p-10 bg-gray-50 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]">
          {isAdmin ? (
            <AdminView appData={appData} updateData={updateData} />
          ) : (
            <PublicView appData={appData} />
          )}
        </main>

        {/* Footer */}
        <footer className="border-t-2 border-black p-4 text-center text-xs font-bold text-gray-500 uppercase tracking-widest bg-white">
          © {new Date().getFullYear()} Standupindo Jogja
        </footer>
      </div>

      {/* PIN Modal */}
      {showPinModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-white border-2 border-black p-8 max-w-sm w-full shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black uppercase">Admin Access</h2>
              <button onClick={() => setShowPinModal(false)} className="text-gray-500 hover:text-black">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleAdminLogin}>
              <div className="mb-4">
                <label className="block text-xs font-bold mb-2 uppercase text-gray-600">Enter PIN (1234)</label>
                <input
                  type="password"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  className={`w-full border-2 p-3 outline-none font-mono text-center text-lg tracking-widest ${pinError ? 'border-red-500 bg-red-50' : 'border-black focus:border-gray-500'}`}
                  placeholder="****"
                  autoFocus
                />
                {pinError && <p className="text-red-500 text-xs font-bold mt-2 uppercase">PIN Salah!</p>}
              </div>
              <button type="submit" className="w-full bg-black text-white font-bold uppercase tracking-widest p-4 hover:bg-gray-800 transition-colors">
                Masuk
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// PUBLIC VIEW COMPONENT
// ==========================================
function PublicView({ appData }) {
  const { date, mc1, mc2, mainList, waitingList } = appData;

  const displayDate = date ? new Date(date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Tanggal Belum Ditentukan';

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      
      {/* Event Info */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center gap-2 bg-black text-white px-6 py-2 rounded-full text-sm font-bold tracking-widest uppercase mb-4 shadow-lg">
          <Calendar size={16} />
          {displayDate}
        </div>
        
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-12">
          <div className="flex flex-col items-center">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">MC Sesi 1</span>
            <span className="text-xl font-black uppercase bg-white border-2 border-black px-6 py-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2">
              <Mic size={20} className="text-gray-400" />
              {mc1 || '-'}
            </span>
          </div>
          <div className="flex flex-col items-center mt-4 sm:mt-0">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">MC Sesi 2</span>
            <span className="text-xl font-black uppercase bg-white border-2 border-black px-6 py-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2">
              <Mic size={20} className="text-gray-400" />
              {mc2 || '-'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Lineup */}
      <div className="bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
        <div className="bg-black text-white p-4">
          <h2 className="text-lg font-black uppercase tracking-widest text-center">Lineup Utama</h2>
        </div>
        <div className="p-4 sm:p-6">
          {mainList.length === 0 ? (
            <p className="text-center text-gray-400 font-bold italic py-8">Belum ada komika yang mendaftar.</p>
          ) : (
            <ul className="space-y-3">
              {mainList.map((komika, idx) => (
                <li key={komika.id} className="flex items-center border-b-2 border-gray-100 pb-3 last:border-0 last:pb-0">
                  <span className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-gray-100 border-2 border-black font-black text-lg mr-4">
                    {idx + 1}
                  </span>
                  <span className="text-xl font-bold uppercase">{komika.name}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Waiting List */}
      {waitingList.length > 0 && (
        <div className="bg-gray-100 border-2 border-black border-dashed opacity-80 mt-8">
          <div className="border-b-2 border-black border-dashed p-3 bg-gray-200">
            <h2 className="text-md font-bold uppercase tracking-widest text-center text-gray-700">Waiting List</h2>
          </div>
          <div className="p-4">
            <ul className="space-y-2">
              {waitingList.map((komika, idx) => (
                <li key={komika.id} className="flex items-center text-gray-600">
                  <span className="w-6 h-6 flex-shrink-0 flex items-center justify-center bg-white border border-gray-400 text-xs font-bold mr-3 rounded-full">
                    {idx + 1}
                  </span>
                  <span className="font-semibold uppercase text-sm">{komika.name}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// ADMIN VIEW COMPONENT
// ==========================================
function AdminView({ appData, updateData }) {
  const [newKomika, setNewKomika] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, action: null, message: '' });

  const addKomika = (e) => {
    e.preventDefault();
    if (!newKomika.trim()) return;

    const newEntry = { id: crypto.randomUUID(), name: newKomika.trim() };
    const newData = { ...appData };

    if (newData.mainList.length < newData.quota) {
      newData.mainList = [...newData.mainList, newEntry];
    } else {
      newData.waitingList = [...newData.waitingList, newEntry];
    }

    updateData(newData);
    setNewKomika('');
  };

  const handleEdit = (id, currentName) => {
    setEditingId(id);
    setEditName(currentName);
  };

  const saveEdit = (listType, id) => {
    const newData = { ...appData };
    newData[listType] = newData[listType].map(k => k.id === id ? { ...k, name: editName } : k);
    updateData(newData);
    setEditingId(null);
  };

  const deleteKomika = (listType, id) => {
    const newData = { ...appData };
    newData[listType] = newData[listType].filter(k => k.id !== id);
    updateData(newData);
  };

  const moveUp = (listType, index) => {
    if (index === 0) return;
    const newData = { ...appData };
    const list = [...newData[listType]];
    [list[index - 1], list[index]] = [list[index], list[index - 1]];
    newData[listType] = list;
    updateData(newData);
  };

  const moveDown = (listType, index) => {
    if (index === appData[listType].length - 1) return;
    const newData = { ...appData };
    const list = [...newData[listType]];
    [list[index + 1], list[index]] = [list[index], list[index + 1]];
    newData[listType] = list;
    updateData(newData);
  };

  const promoteToMain = (id) => {
    if (appData.mainList.length >= appData.quota) {
      // Trigger a custom alert modal instead of browser alert
      setConfirmModal({
        isOpen: true,
        message: 'Kuota utama sudah penuh! Hapus atau pindahkan komika dari lineup utama terlebih dahulu.',
        action: () => setConfirmModal({ isOpen: false, action: null, message: '' }),
        isAlertOnly: true
      });
      return;
    }
    
    const komika = appData.waitingList.find(k => k.id === id);
    const newData = {
      ...appData,
      waitingList: appData.waitingList.filter(k => k.id !== id),
      mainList: [...appData.mainList, komika]
    };
    updateData(newData);
  };

  const demoteToWaiting = (id) => {
    const komika = appData.mainList.find(k => k.id === id);
    const newData = {
      ...appData,
      mainList: appData.mainList.filter(k => k.id !== id),
      waitingList: [komika, ...appData.waitingList] // Put at top of waiting list
    };
    updateData(newData);
  };

  const handleNextWeek = () => {
    setConfirmModal({
      isOpen: true,
      message: 'Anda yakin ingin mereset jadwal untuk minggu depan? Daftar utama akan dihapus dan diisi oleh waiting list.',
      isAlertOnly: false,
      action: () => {
        const quota = appData.quota;
        const newMain = appData.waitingList.slice(0, quota);
        const newWaiting = appData.waitingList.slice(quota);
        
        // Coba set tanggal ke jumat depan (asumsi dasar +7 hari jika ada tanggal)
        let newDateStr = '';
        if (appData.date) {
          const currentDate = new Date(appData.date);
          currentDate.setDate(currentDate.getDate() + 7);
          newDateStr = currentDate.toISOString().split('T')[0];
        }

        updateData({
          ...appData,
          date: newDateStr,
          mc1: '',
          mc2: '',
          mainList: newMain,
          waitingList: newWaiting
        });
        setConfirmModal({ isOpen: false, action: null, message: '' });
      }
    });
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-300">
      
      {/* Admin Controls Panel */}
      <div className="bg-white border-2 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <h2 className="text-xl font-black uppercase mb-6 flex items-center gap-2 border-b-2 border-black pb-4">
          <Settings size={24} /> Pengaturan Acara
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold mb-1 uppercase">Tanggal Acara (Jumat)</label>
              <input 
                type="date" 
                value={appData.date} 
                onChange={(e) => updateData({...appData, date: e.target.value})}
                className="w-full border-2 border-black p-2 font-bold focus:bg-gray-50 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1 uppercase">Kuota Komika (Max)</label>
              <input 
                type="number" 
                value={appData.quota} 
                onChange={(e) => updateData({...appData, quota: parseInt(e.target.value) || 0})}
                min="1"
                className="w-full border-2 border-black p-2 font-bold focus:bg-gray-50 outline-none text-xl"
              />
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold mb-1 uppercase">Nama MC Sesi 1</label>
              <input 
                type="text" 
                value={appData.mc1} 
                onChange={(e) => updateData({...appData, mc1: e.target.value})}
                placeholder="Masukkan nama MC 1..."
                className="w-full border-2 border-black p-2 font-bold focus:bg-gray-50 outline-none uppercase"
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1 uppercase">Nama MC Sesi 2</label>
              <input 
                type="text" 
                value={appData.mc2} 
                onChange={(e) => updateData({...appData, mc2: e.target.value})}
                placeholder="Masukkan nama MC 2..."
                className="w-full border-2 border-black p-2 font-bold focus:bg-gray-50 outline-none uppercase"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Input New Komika */}
      <div className="bg-black p-6 shadow-[8px_8px_0px_0px_rgba(200,200,200,1)] border-2 border-black text-white">
        <h2 className="text-lg font-black uppercase mb-4">Tambah Komika Baru</h2>
        <form onSubmit={addKomika} className="flex gap-2">
          <input 
            type="text" 
            value={newKomika}
            onChange={(e) => setNewKomika(e.target.value)}
            placeholder="Nama Komika..."
            className="flex-1 bg-white text-black font-bold uppercase p-3 border-2 border-transparent outline-none focus:border-gray-400"
          />
          <button type="submit" className="bg-white text-black font-black uppercase tracking-widest px-6 hover:bg-gray-200 transition-colors">
            Tambah
          </button>
        </form>
        <p className="text-xs text-gray-400 mt-3">
          Jika lineup utama penuh ({appData.quota}), otomatis masuk Waiting List.
        </p>
      </div>

      {/* List Manager: Main Lineup */}
      <div>
        <h2 className="text-xl font-black uppercase mb-4 flex justify-between items-end border-b-2 border-black pb-2">
          <span>Lineup Utama</span>
          <span className="text-sm font-bold text-gray-500 bg-gray-200 px-3 py-1">
            {appData.mainList.length} / {appData.quota}
          </span>
        </h2>
        
        <div className="space-y-2">
          {appData.mainList.map((komika, index) => (
            <div key={komika.id} className="bg-white border-2 border-black p-3 flex items-center justify-between shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all">
              <div className="flex items-center gap-4 flex-1">
                {/* Order Controls */}
                <div className="flex flex-col">
                  <button onClick={() => moveUp('mainList', index)} className="p-1 hover:bg-gray-200 disabled:opacity-30" disabled={index === 0}><ArrowUp size={14}/></button>
                  <button onClick={() => moveDown('mainList', index)} className="p-1 hover:bg-gray-200 disabled:opacity-30" disabled={index === appData.mainList.length - 1}><ArrowDown size={14}/></button>
                </div>
                
                <span className="font-black text-lg w-6">{index + 1}.</span>
                
                {/* Edit Mode Toggle */}
                {editingId === komika.id ? (
                  <div className="flex flex-1 gap-2">
                    <input 
                      autoFocus
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="flex-1 border-b-2 border-black font-bold uppercase outline-none"
                    />
                    <button onClick={() => saveEdit('mainList', komika.id)} className="bg-green-500 text-white p-1 rounded-sm"><Check size={16}/></button>
                  </div>
                ) : (
                  <span className="font-bold uppercase flex-1 text-lg">{komika.name}</span>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 ml-4">
                <button 
                  onClick={() => demoteToWaiting(komika.id)}
                  title="Pindah ke Waiting List"
                  className="p-2 border-2 border-gray-300 hover:bg-gray-100 hover:border-black transition-colors"
                >
                  <ArrowRight size={16} />
                </button>
                <button onClick={() => handleEdit(komika.id, komika.name)} className="p-2 border-2 border-blue-200 text-blue-600 hover:bg-blue-50 transition-colors">
                  <Edit2 size={16} />
                </button>
                <button onClick={() => deleteKomika('mainList', komika.id)} className="p-2 border-2 border-red-200 text-red-600 hover:bg-red-50 transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
          {appData.mainList.length === 0 && (
            <div className="text-center py-6 border-2 border-dashed border-gray-300 font-bold text-gray-400">Kosong</div>
          )}
        </div>
      </div>

      {/* List Manager: Waiting List */}
      <div className="opacity-80">
        <h2 className="text-lg font-black uppercase mb-4 text-gray-600 border-b-2 border-gray-300 pb-2">Waiting List</h2>
        
        <div className="space-y-2">
          {appData.waitingList.map((komika, index) => (
            <div key={komika.id} className="bg-gray-50 border-2 border-gray-300 p-2 flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <span className="font-bold text-gray-500 w-6 text-right">{index + 1}.</span>
                {editingId === komika.id ? (
                  <div className="flex flex-1 gap-2">
                    <input 
                      autoFocus
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="flex-1 bg-transparent border-b-2 border-gray-400 font-bold uppercase outline-none"
                    />
                    <button onClick={() => saveEdit('waitingList', komika.id)} className="bg-green-500 text-white p-1 rounded-sm"><Check size={16}/></button>
                  </div>
                ) : (
                  <span className="font-bold uppercase flex-1 text-gray-700">{komika.name}</span>
                )}
              </div>

              <div className="flex gap-2 ml-4">
                <button 
                  onClick={() => promoteToMain(komika.id)}
                  title="Naikkan ke Lineup Utama"
                  className="p-1 border-2 border-green-300 text-green-700 hover:bg-green-50 transition-colors text-xs font-bold uppercase px-2"
                >
                  Naik Utama
                </button>
                <button onClick={() => handleEdit(komika.id, komika.name)} className="p-1 text-blue-500 hover:bg-blue-50">
                  <Edit2 size={14} />
                </button>
                <button onClick={() => deleteKomika('waitingList', komika.id)} className="p-1 text-red-500 hover:bg-red-50">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
          {appData.waitingList.length === 0 && (
            <div className="text-center py-4 border-2 border-dashed border-gray-200 font-bold text-gray-400 text-sm">Kosong</div>
          )}
        </div>
      </div>

      {/* Dangerous Action: Next Week Reset */}
      <div className="pt-8 mt-12 border-t-4 border-black text-center">
        <button 
          onClick={handleNextWeek}
          className="bg-black text-white px-8 py-4 font-black uppercase tracking-widest text-lg border-2 border-transparent hover:bg-white hover:text-black hover:border-black transition-all shadow-[8px_8px_0px_0px_rgba(200,200,200,1)] hover:shadow-none hover:translate-y-2 hover:translate-x-2"
        >
          Shift Ke Minggu Depan 🚀
        </button>
        <p className="mt-4 text-xs font-bold text-gray-500 uppercase max-w-md mx-auto">
          Tindakan ini akan mengosongkan lineup utama saat ini, lalu menaikkan orang dari waiting list ke lineup utama sesuai kuota.
        </p>
      </div>

      {/* Custom Confirm/Alert Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-white border-4 border-black p-8 max-w-sm w-full shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] text-center animate-in zoom-in-95 duration-200">
            <h3 className="text-2xl font-black uppercase mb-4">PERHATIAN</h3>
            <p className="font-bold text-gray-600 mb-8">{confirmModal.message}</p>
            <div className="flex gap-4 justify-center">
              {!confirmModal.isAlertOnly && (
                <button 
                  onClick={() => setConfirmModal({ isOpen: false, action: null, message: '' })}
                  className="px-6 py-2 border-2 border-black font-bold uppercase hover:bg-gray-100"
                >
                  Batal
                </button>
              )}
              <button 
                onClick={confirmModal.action}
                className="px-6 py-2 bg-black text-white font-bold uppercase border-2 border-black hover:bg-gray-800"
              >
                {confirmModal.isAlertOnly ? 'Tutup' : 'Ya, Lanjutkan'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}