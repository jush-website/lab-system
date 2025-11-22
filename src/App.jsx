import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged, 
  signOut,
  signInAnonymously
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  serverTimestamp,
  query, 
  where,
  orderBy,
  increment,
  limit,
  getDocs 
} from 'firebase/firestore';
import { 
  Beaker, ClipboardList, Settings, LogOut, Plus, Search, Trash2, Edit2, 
  Download, Filter, AlertTriangle, User, LayoutGrid, Menu, X, CheckCircle, 
  AlertCircle, Eye, EyeOff, ChevronRight, UserPlus, Calendar, FolderOpen,
  History, UserCheck, Phone, ArrowLeft, Clock, FileText, Hash, Home, 
  Activity, Box, FileDown, ArrowUpRight, ArrowDownLeft, MousePointerClick, Sparkles
} from 'lucide-react';

// ==========================================
// 🟢 您的 Firebase 設定 (已整合)
// ==========================================
const YOUR_FIREBASE_CONFIG = {
  apiKey: "AIzaSyDT27VtfNpabeloAXh31gSIIodygJNvDsU",
  authDomain: "lab-management-5fc5d.firebaseapp.com",
  projectId: "lab-management-5fc5d",
  storageBucket: "lab-management-5fc5d.firebasestorage.app",
  messagingSenderId: "762555415570",
  appId: "1:762555415570:web:d4ee52fd7971d8e0996ccb",
  measurementId: "G-TEL1QYTRCK"
};

// --- 系統初始化 ---
const app = initializeApp(YOUR_FIREBASE_CONFIG);
const auth = getAuth(app);
const db = getFirestore(app);
// 固定 App ID 以確保資料路徑一致
const appId = 'lab-management-system-production';

// --- 元件：自定義確認視窗 ---
const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel, isDangerous }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all scale-100">
        <div className="p-6 text-center">
          <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4 ${isDangerous ? 'bg-red-100 text-red-600' : 'bg-teal-100 text-teal-600'}`}>
            {isDangerous ? <AlertTriangle className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
          <p className="text-sm text-gray-500 mb-6">{message}</p>
          <div className="flex gap-3">
            <button onClick={onCancel} className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors">取消</button>
            <button onClick={onConfirm} className={`flex-1 px-4 py-2.5 text-white rounded-lg font-medium shadow-md transition-colors ${isDangerous ? 'bg-red-500 hover:bg-red-600' : 'bg-teal-600 hover:bg-teal-700'}`}>確認</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- 元件：訊息提示 Toast ---
const Toast = ({ message, type, onClose }) => {
  useEffect(() => { const timer = setTimeout(onClose, 3000); return () => clearTimeout(timer); }, [onClose]);
  return (
    <div className="fixed top-4 right-4 z-[70] animate-in slide-in-from-right duration-300">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border ${type === 'success' ? 'bg-white border-teal-100 text-teal-800' : 'bg-white border-red-100 text-red-800'}`}>
        {type === 'success' ? <CheckCircle className="w-5 h-5 text-teal-500" /> : <AlertCircle className="w-5 h-5 text-red-500" />}
        <span className="font-medium text-sm">{message}</span>
      </div>
    </div>
  );
};

// --- 元件：儀表板卡片 ---
const StatCard = ({ title, value, subtext, icon: Icon, colorClass, onClick }) => (
  <div 
    onClick={onClick}
    className={`bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-start justify-between transition-all group relative overflow-hidden ${onClick ? 'cursor-pointer hover:shadow-lg hover:-translate-y-1 active:scale-95' : ''}`}
  >
    <div className="relative z-10">
      <p className="text-sm font-medium text-slate-500 mb-1 flex items-center gap-1">
        {title}
        {onClick && <MousePointerClick className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity"/>}
      </p>
      <h3 className="text-3xl font-bold text-slate-800">{value}</h3>
      {subtext && <p className="text-xs text-slate-400 mt-2">{subtext}</p>}
    </div>
    <div className={`p-3 rounded-xl ${colorClass} shadow-sm group-hover:scale-110 transition-transform`}>
      <Icon className="w-6 h-6 text-white" />
    </div>
  </div>
);

// --- 頁面：登入與註冊 ---
const AuthScreen = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 自動清除舊的登入狀態，防止錯誤
  useEffect(() => {
    const clearStaleAuth = async () => { try { await signOut(auth); } catch (e) {} };
    clearStaleAuth();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true); setError('');
    try {
      if (isRegister) await createUserWithEmailAndPassword(auth, email, password);
      else await signInWithEmailAndPassword(auth, email, password);
    } catch (err) { 
      console.error(err);
      let msg = `登入失敗 (${err.code})`;
      if(err.code === 'auth/invalid-email') msg = "Email 格式不正確";
      if(err.code === 'auth/user-not-found') msg = "找不到此使用者，請先註冊";
      if(err.code === 'auth/wrong-password') msg = "密碼錯誤";
      if(err.code === 'auth/email-already-in-use') msg = "此 Email 已被註冊";
      if(err.code === 'auth/weak-password') msg = "密碼太弱（至少需 6 位）";
      if(err.code === 'auth/invalid-credential') msg = "帳號或密碼錯誤";
      setError(msg);
    } finally { setLoading(false); }
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    try { await signInAnonymously(auth); } 
    catch (err) { setError("訪客登入失敗 (請確認 Firebase 後台已啟用匿名登入)"); } 
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4 font-sans">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden p-8">
        <div className="text-center mb-6">
          <div className="mx-auto w-16 h-16 bg-teal-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg"><Beaker className="w-8 h-8 text-white"/></div>
          <h1 className="text-2xl font-bold text-slate-800">實驗室管理系統</h1>
          <p className="text-teal-600 text-sm mt-1">V7 最終完整版</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} className="w-full border border-slate-300 p-3 rounded-lg outline-none focus:border-teal-500" required />
          <input type="password" placeholder="密碼 (至少6位)" value={password} onChange={e=>setPassword(e.target.value)} className="w-full border border-slate-300 p-3 rounded-lg outline-none focus:border-teal-500" required />
          {error && <div className="p-3 bg-red-50 text-red-600 text-xs rounded-lg flex items-center gap-2"><AlertTriangle className="w-4 h-4 flex-shrink-0"/> {error}</div>}
          <button type="submit" disabled={loading} className="w-full bg-teal-600 text-white py-3 rounded-lg font-bold hover:bg-teal-700 transition-colors">{loading?'處理中...':(isRegister?'註冊帳號':'登入系統')}</button>
        </form>
        <button onClick={() => {setIsRegister(!isRegister); setError('')}} className="w-full mt-4 text-sm text-slate-500 hover:text-teal-600">切換為 {isRegister ? '登入' : '註冊'}</button>
        <button onClick={handleDemoLogin} className="w-full mt-2 text-sm text-slate-400 underline hover:text-teal-600">訪客登入 (免註冊)</button>
      </div>
    </div>
  );
};

// --- 主應用程式 ---
export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Navigation
  const [viewMode, setViewMode] = useState('dashboard'); 
  const [currentSession, setCurrentSession] = useState(null); 

  // Data
  const [sessions, setSessions] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loans, setLoans] = useState([]);
  
  // Dashboard Stats
  const [dashboardStats, setDashboardStats] = useState({
    latestSessionId: null,
    latestSessionName: '無資料',
    totalEquipment: 0,
    totalBorrowed: 0,
    lowStockCount: 0,
    recentActivity: []
  });

  // UI State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', action: null });
  
  // Modals State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState(''); 
  const [editItem, setEditItem] = useState(null);
  
  // Forms State
  const [sessionForm, setSessionForm] = useState({ name: '', date: '' });
  const [equipForm, setEquipForm] = useState({ name: '', quantity: 1, categoryId: '', note: '' });
  const [catForm, setCatForm] = useState({ name: '' });
  const [borrowForm, setBorrowForm] = useState({ borrower: '', phone: '', date: '', equipmentId: '', equipmentName: '', purpose: '', quantity: 1, maxQuantity: 0 });

  // Init Auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, u => { setUser(u); setLoading(false); });
    return () => unsubscribe();
  }, []);

  // Global Listeners
  useEffect(() => {
    if (!user) return;
    const unsubCat = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'categories'), snap => setCategories(snap.docs.map(d => ({id: d.id, ...d.data()}))));
    const qSession = query(collection(db, 'artifacts', appId, 'public', 'data', 'sessions'), orderBy('date', 'desc'));
    const unsubSess = onSnapshot(qSession, snap => setSessions(snap.docs.map(d => ({id: d.id, ...d.data()}))));
    return () => { unsubCat(); unsubSess(); };
  }, [user]);

  // Dashboard Logic: Lock to Latest Session
  useEffect(() => {
    if (!user || viewMode !== 'dashboard' || sessions.length === 0) {
      if (sessions.length === 0 && viewMode === 'dashboard') {
        setDashboardStats({ latestSessionId: null, latestSessionName: '尚無版次', totalEquipment: 0, totalBorrowed: 0, lowStockCount: 0, recentActivity: [] });
      }
      return;
    }

    const latestSession = sessions[0];
    const targetSessionId = latestSession.id;

    const qEquip = query(collection(db, 'artifacts', appId, 'public', 'data', 'equipment'), where('sessionId', '==', targetSessionId));
    const unsubEquip = onSnapshot(qEquip, (snap) => {
      let equipCount = 0;
      let borrowedCount = 0;
      let lowStock = 0;
      snap.forEach(doc => {
        const data = doc.data();
        equipCount += (data.quantity || 0);
        borrowedCount += (data.borrowedCount || 0);
        if ((data.quantity - (data.borrowedCount || 0)) < 3) lowStock++;
      });
      setDashboardStats(prev => ({ ...prev, latestSessionId: targetSessionId, latestSessionName: latestSession.name, totalEquipment: equipCount, totalBorrowed: borrowedCount, lowStockCount: lowStock }));
    });

    const qLoans = query(collection(db, 'artifacts', appId, 'public', 'data', 'loans'), where('sessionId', '==', targetSessionId), orderBy('createdAt', 'desc'), limit(10));
    const unsubLoans = onSnapshot(qLoans, (snap) => {
      const activities = snap.docs.map(d => ({id: d.id, ...d.data()}));
      setDashboardStats(prev => ({ ...prev, recentActivity: activities }));
    });

    return () => { unsubEquip(); unsubLoans(); };
  }, [user, viewMode, sessions]); 

  // Session Specific Data
  useEffect(() => {
    if (!user || !currentSession) return;
    const qEquip = query(collection(db, 'artifacts', appId, 'public', 'data', 'equipment'), where('sessionId', '==', currentSession.id));
    const unsubEquip = onSnapshot(qEquip, snap => setEquipment(snap.docs.map(d => ({id: d.id, ...d.data()}))));
    const qLoan = query(collection(db, 'artifacts', appId, 'public', 'data', 'loans'), where('sessionId', '==', currentSession.id), orderBy('borrowDate', 'desc'));
    const unsubLoans = onSnapshot(qLoan, snap => setLoans(snap.docs.map(d => ({id: d.id, ...d.data()}))));
    return () => { unsubEquip(); unsubLoans(); };
  }, [user, currentSession]);

  const showToast = (msg, type='success') => setToast({message: msg, type});
  const getAvailability = (item) => (item.quantity - (item.borrowedCount || 0));

  // Handlers
  const handleStatClick = (target) => {
    if (!dashboardStats.latestSessionId) { showToast("目前無資料", "error"); return; }
    const targetSession = sessions.find(s => s.id === dashboardStats.latestSessionId);
    if (targetSession) {
      setCurrentSession(targetSession);
      if (target === 'borrowed') setViewMode('loans');
      else setViewMode('equipment');
      showToast(`已進入最新版次：${targetSession.name}`);
    }
  };

  const handleActivityClick = (activity) => {
    const targetSession = sessions.find(s => s.id === activity.sessionId);
    if (targetSession) {
      setCurrentSession(targetSession);
      setViewMode('loans');
      showToast(`已跳轉至版次：${targetSession.name}`);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (!equipment.length) { showToast("無資料可匯出", "error"); return; }
    const headers = ["設備名稱", "分類", "總數量", "已借出", "剩餘庫存", "備註"];
    const rows = filteredEquipment.map(item => {
      const borrowed = item.borrowedCount || 0; const remaining = item.quantity - borrowed;
      return [`"${item.name.replace(/"/g, '""')}"`, `"${item.categoryName}"`, item.quantity, borrowed, remaining, `"${(item.note || "").replace(/"/g, '""')}"`].join(",");
    });
    const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url; link.download = `${currentSession.name}_設備清單.csv`; document.body.appendChild(link); link.click(); document.body.removeChild(link); showToast("CSV 下載已開始");
  };

  // CRUD Handlers
  const handleSaveSession = async (e) => { e.preventDefault(); try { const payload = { name: sessionForm.name, date: sessionForm.date, createdAt: serverTimestamp(), createdBy: user.uid }; if (editItem) await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'sessions', editItem.id), payload); else await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'sessions'), payload); setIsModalOpen(false); showToast("版次儲存成功"); } catch (err) { showToast("錯誤", "error"); } };
  const deleteSession = (id) => { setConfirmDialog({ isOpen: true, title: "刪除版次", message: "確定要刪除？這會隱藏其下的資料。", isDangerous: true, action: async () => { await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'sessions', id)); setConfirmDialog(p => ({...p, isOpen: false})); showToast("版次已刪除"); } }); };
  const handleSaveEquipment = async (e) => { e.preventDefault(); if (!currentSession) return; try { const cat = categories.find(c => c.id === equipForm.categoryId); const payload = { name: equipForm.name, quantity: parseInt(equipForm.quantity), categoryId: equipForm.categoryId, categoryName: cat ? cat.name : '未分類', note: equipForm.note, sessionId: currentSession.id, ...(editItem ? {} : { borrowedCount: 0 }), updatedAt: serverTimestamp() }; if (editItem) await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'equipment', editItem.id), payload); else await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'equipment'), payload); setIsModalOpen(false); showToast("設備儲存成功"); } catch (err) { showToast("錯誤", "error"); } };
  const handleSaveCategory = async (e) => { e.preventDefault(); try { if (editItem) await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'categories', editItem.id), {name: catForm.name}); else await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'categories'), {name: catForm.name}); setIsModalOpen(false); showToast("分類儲存成功"); } catch (err) { showToast("錯誤", "error"); } };
  const handleBorrow = async (e) => { e.preventDefault(); if (!currentSession) return; const qty = parseInt(borrowForm.quantity); if (qty > borrowForm.maxQuantity) { showToast(`庫存不足`, "error"); return; } if (qty <= 0) { showToast("數量錯誤", "error"); return; } try { await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'loans'), { sessionId: currentSession.id, equipmentId: borrowForm.equipmentId, equipmentName: borrowForm.equipmentName, borrower: borrowForm.borrower, phone: borrowForm.phone, purpose: borrowForm.purpose, quantity: qty, borrowDate: borrowForm.date, returnDate: null, status: 'borrowed', createdAt: serverTimestamp() }); await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'equipment', borrowForm.equipmentId), { borrowedCount: increment(qty) }); setIsModalOpen(false); showToast("借用登記成功"); } catch (err) { showToast("借用失敗", "error"); } };
  const handleReturn = (loan) => { setConfirmDialog({ isOpen: true, title: "歸還確認", message: `確定歸還「${loan.equipmentName}」共 ${loan.quantity} 個嗎？`, isDangerous: false, action: async () => { try { await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'loans', loan.id), { returnDate: new Date().toISOString().split('T')[0], status: 'returned' }); await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'equipment', loan.equipmentId), { borrowedCount: increment(-loan.quantity) }); setConfirmDialog(p => ({...p, isOpen: false})); showToast("歸還完成"); } catch (err) { showToast("操作失敗", "error"); } } }); };
  
  const filteredEquipment = useMemo(() => { return equipment.filter(item => { const matchSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()); const matchCat = selectedCategoryFilter === 'all' || item.categoryId === selectedCategoryFilter; return matchSearch && matchCat; }); }, [equipment, searchTerm, selectedCategoryFilter]);
  const openSessionModal = (item=null) => { setModalType('session'); setEditItem(item); setSessionForm(item ? {name: item.name, date: item.date} : {name: '', date: new Date().toISOString().slice(0,10)}); setIsModalOpen(true); };
  const openEquipModal = (item=null) => { setModalType('equipment'); setEditItem(item); setEquipForm(item ? {name: item.name, quantity: item.quantity, categoryId: item.categoryId, note: item.note} : {name: '', quantity: 1, categoryId: categories[0]?.id || '', note: ''}); setIsModalOpen(true); };
  const openBorrowModal = (item) => { const available = getAvailability(item); if (available <= 0) { showToast("無庫存可借", "error"); return; } setModalType('borrow'); setBorrowForm({ borrower: '', phone: '', purpose: '', date: new Date().toISOString().slice(0,10), equipmentId: item.id, equipmentName: item.name, quantity: 1, maxQuantity: available }); setIsModalOpen(true); };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-teal-600 font-medium">系統載入中...</div>;
  if (!user) return <AuthScreen />;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans text-slate-800">
      <ConfirmModal isOpen={confirmDialog.isOpen} title={confirmDialog.title} message={confirmDialog.message} onConfirm={confirmDialog.action} onCancel={()=>setConfirmDialog(p=>({...p, isOpen:false}))} isDangerous={confirmDialog.isDangerous} />
      {toast && <Toast message={toast.message} type={toast.type} onClose={()=>setToast(null)} />}

      <aside className={`fixed md:relative z-30 w-64 bg-teal-800 text-teal-50 h-screen transition-transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 flex flex-col shadow-2xl`}>
        <div className="p-6 bg-teal-900/40">
          <h1 className="text-xl font-bold flex items-center gap-2 text-white"><Beaker className="text-teal-300"/> 實驗室管理</h1>
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <button onClick={() => { setViewMode('dashboard'); setCurrentSession(null); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${viewMode === 'dashboard' ? 'bg-teal-600 text-white shadow-lg' : 'hover:bg-teal-700/50 text-teal-100'}`}>
            <Home className="w-5 h-5" /> <span className="font-medium">首頁概覽</span>
          </button>
          <button onClick={() => { setViewMode('sessions'); setCurrentSession(null); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${viewMode === 'sessions' ? 'bg-teal-600 text-white shadow-lg' : 'hover:bg-teal-700/50 text-teal-100'}`}>
            <FolderOpen className="w-5 h-5" /> <span className="font-medium">版次/清單管理</span>
          </button>
          <button onClick={() => { setViewMode('categories'); setCurrentSession(null); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${viewMode === 'categories' ? 'bg-teal-600 text-white shadow-lg' : 'hover:bg-teal-700/50 text-teal-100'}`}>
            <Settings className="w-5 h-5" /> <span className="font-medium">全域分類設定</span>
          </button>
          {currentSession && (
            <div className="mt-6 pt-6 border-t border-teal-700/50 animate-in fade-in slide-in-from-left duration-300">
              <p className="px-4 text-xs font-bold text-teal-300 uppercase mb-2">當前版次：{currentSession.name}</p>
              <button onClick={() => { setViewMode('equipment'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${viewMode === 'equipment' ? 'bg-teal-500 text-white shadow-lg' : 'hover:bg-teal-700/50 text-teal-100'}`}>
                <LayoutGrid className="w-5 h-5" /> <span className="font-medium">設備列表</span>
              </button>
              <button onClick={() => { setViewMode('loans'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${viewMode === 'loans' ? 'bg-teal-500 text-white shadow-lg' : 'hover:bg-teal-700/50 text-teal-100'}`}>
                <History className="w-5 h-5" /> <span className="font-medium">借還紀錄表</span>
              </button>
            </div>
          )}
        </nav>
        <div className="p-4 border-t border-teal-700">
           <button onClick={()=>signOut(auth)} className="flex items-center gap-2 text-sm text-red-200 hover:text-white"><LogOut className="w-4 h-4"/> 登出</button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="bg-white shadow-sm p-4 flex items-center justify-between z-20 flex-shrink-0">
          <div className="flex items-center gap-4">
             <button onClick={()=>setIsSidebarOpen(!isSidebarOpen)} className="md:hidden p-2"><Menu/></button>
             <div>
                <h2 className="text-2xl font-bold text-slate-800">
                  {viewMode === 'dashboard' && '首頁概覽'}
                  {viewMode === 'sessions' && '版次管理'}
                  {viewMode === 'categories' && '分類設定'}
                  {currentSession && viewMode === 'equipment' && `${currentSession.name} - 設備`}
                  {currentSession && viewMode === 'loans' && `${currentSession.name} - 借還紀錄`}
                </h2>
             </div>
          </div>
          <div className="flex gap-2">
            {viewMode === 'equipment' && currentSession && <button onClick={handleExportCSV} className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-slate-50 shadow-sm transition-all active:scale-95"><FileDown className="w-4 h-4 text-teal-600"/> <span className="hidden sm:inline">匯出 CSV</span></button>}
            {viewMode === 'sessions' && <button onClick={()=>openSessionModal()} className="bg-teal-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-teal-700 shadow-md transition-all active:scale-95"><Plus className="w-4 h-4"/> 新增版次</button>}
            {viewMode === 'equipment' && <button onClick={()=>openEquipModal()} className="bg-teal-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-teal-700 shadow-md transition-all active:scale-95"><Plus className="w-4 h-4"/> 新增設備</button>}
            {viewMode === 'categories' && <button onClick={()=>{setModalType('category');setEditItem(null);setCatForm({name:''});setIsModalOpen(true)}} className="bg-teal-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-teal-700 shadow-md transition-all active:scale-95"><Plus className="w-4 h-4"/> 新增分類</button>}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50">
          
          {viewMode === 'dashboard' && (
            <div className="space-y-6 max-w-7xl mx-auto">
              <div className="flex items-center gap-2 mb-4"><div className="bg-teal-100 text-teal-700 p-2 rounded-lg"><Sparkles className="w-5 h-5"/></div><span className="text-sm font-bold text-slate-500">目前鎖定：<span className="text-teal-700 text-base">{dashboardStats.latestSessionName}</span></span></div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="最新版次設備總數" value={dashboardStats.totalEquipment} icon={Box} colorClass="bg-teal-500" onClick={() => handleStatClick('equipment')} />
                <StatCard title="目前外借中" value={dashboardStats.totalBorrowed} icon={Activity} colorClass="bg-orange-500" onClick={() => handleStatClick('borrowed')} />
                <StatCard title="低庫存警示" value={dashboardStats.lowStockCount} subtext="庫存低於 3 件" icon={AlertTriangle} colorClass="bg-red-500" onClick={() => handleStatClick('lowstock')} />
                <StatCard title="管理中版次總數" value={sessions.length} icon={FolderOpen} colorClass="bg-blue-500" onClick={() => handleStatClick('sessions')} />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col h-[400px]">
                  <div className="flex items-center justify-between mb-4"><h3 className="font-bold text-lg text-slate-800 flex items-center gap-2"><History className="w-5 h-5 text-teal-600"/> {dashboardStats.latestSessionName} - 最新借用動態</h3></div>
                  <div className="flex-1 overflow-auto">
                    <table className="w-full text-left min-w-[500px]">
                      <thead className="text-slate-400 text-xs uppercase bg-slate-50 sticky top-0 z-10"><tr><th className="p-3">日期</th><th className="p-3">借用人</th><th className="p-3">物品</th><th className="p-3">狀態</th></tr></thead>
                      <tbody className="divide-y divide-slate-50 text-sm">
                        {dashboardStats.recentActivity.map(item => (
                          <tr key={item.id} onClick={() => handleActivityClick(item)} className="hover:bg-slate-50/80 cursor-pointer transition-colors group">
                            <td className="p-3 text-slate-500">{item.borrowDate}</td>
                            <td className="p-3 font-medium">{item.borrower}</td>
                            <td className="p-3 group-hover:text-teal-600">{item.equipmentName} <span className="text-xs bg-slate-100 px-1 rounded">x{item.quantity}</span></td>
                            <td className="p-3">{item.status === 'borrowed' ? <span className="flex items-center gap-1 text-orange-600 bg-orange-50 px-2 py-0.5 rounded text-xs w-fit"><ArrowUpRight className="w-3 h-3"/> 借出</span> : <span className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-0.5 rounded text-xs w-fit"><ArrowDownLeft className="w-3 h-3"/> 歸還</span>}</td>
                          </tr>
                        ))}
                        {dashboardStats.recentActivity.length===0 && <tr><td colSpan="4" className="p-6 text-center text-slate-400">本版次暫無近期活動</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-teal-600 to-teal-800 rounded-2xl p-6 text-white shadow-lg flex flex-col justify-center relative overflow-hidden">
                  <h3 className="font-bold text-lg mb-2 relative z-10">最新版次提示</h3>
                  <p className="text-teal-100 text-sm mb-6 relative z-10">系統目前自動鎖定在日期最新的版次「{dashboardStats.latestSessionName}」。儀表板上的數據僅反映此版次的內容。</p>
                  <button onClick={() => { setViewMode('sessions'); setCurrentSession(null); }} className="w-full bg-white/20 hover:bg-white/30 text-white py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 relative z-10 border border-white/20">查看所有版次 <ChevronRight className="w-4 h-4"/></button>
                </div>
              </div>
            </div>
          )}

          {viewMode === 'sessions' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
              {sessions.map(sess => (
                <div key={sess.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 hover:shadow-lg transition-all cursor-pointer group relative overflow-hidden transform hover:-translate-y-1">
                  <div onClick={() => { setCurrentSession(sess); setViewMode('equipment'); }} className="p-6">
                    <div className="flex items-center justify-between mb-4"><div className="p-3 bg-teal-50 rounded-xl text-teal-600 group-hover:bg-teal-600 group-hover:text-white transition-colors"><Calendar className="w-6 h-6"/></div><span className="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-1 rounded-full">{sess.date}</span></div>
                    <h3 className="text-xl font-bold text-slate-800 mb-1">{sess.name}</h3>
                    <p className="text-sm text-slate-500">管理設備清單與借用紀錄</p>
                  </div>
                  <div className="bg-slate-50 px-6 py-3 border-t flex justify-between items-center"><span className="text-xs text-slate-400 font-mono">#{sess.id.slice(0,6)}</span><div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={(e)=>{e.stopPropagation();openSessionModal(sess)}} className="p-2 text-slate-400 hover:text-teal-600"><Edit2 className="w-4 h-4"/></button><button onClick={(e)=>{e.stopPropagation();deleteSession(sess.id)}} className="p-2 text-slate-400 hover:text-red-600"><Trash2 className="w-4 h-4"/></button></div></div>
                </div>
              ))}
              {sessions.length === 0 && <div className="col-span-full text-center py-20 text-slate-400">尚未建立任何版次</div>}
            </div>
          )}

          {viewMode === 'equipment' && currentSession && (
            <div className="space-y-6 max-w-[1600px] mx-auto">
              <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4"/><input type="text" placeholder="搜尋設備..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-teal-500"/></div>
                <select value={selectedCategoryFilter} onChange={e=>setSelectedCategoryFilter(e.target.value)} className="border rounded-lg px-4 py-2 outline-none bg-white"><option value="all">所有分類</option>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select>
              </div>
              <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-slate-200 flex flex-col max-h-[70vh]">
                <div className="overflow-auto flex-1">
                  <table className="w-full text-left min-w-[900px] border-collapse">
                    <thead className="bg-slate-50 border-b text-sm uppercase text-slate-500 sticky top-0 z-20 shadow-sm"><tr><th className="p-4 font-semibold w-1/4 bg-slate-50">設備名稱</th><th className="p-4 font-semibold w-1/3 bg-slate-50">庫存狀態</th><th className="p-4 font-semibold bg-slate-50 whitespace-nowrap">分類</th><th className="p-4 font-semibold text-right bg-slate-50 sticky right-0">操作</th></tr></thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredEquipment.map(item => {
                        const borrowed = item.borrowedCount || 0; const available = item.quantity - borrowed;
                        return (
                          <tr key={item.id} className="hover:bg-teal-50/30 transition-colors">
                            <td className="p-4"><div className="font-bold text-slate-700 text-base">{item.name}</div>{item.note && <div className="text-xs text-slate-400 mt-1 max-w-xs truncate">{item.note}</div>}</td>
                            <td className="p-4"><div className="flex items-center gap-3"><span className="bg-slate-100 px-2 py-1 rounded text-sm whitespace-nowrap">總 {item.quantity}</span> <span className="text-orange-600 bg-orange-50 px-2 py-1 rounded text-sm whitespace-nowrap">借 {borrowed}</span> <span className={`px-2 py-1 rounded text-sm font-bold whitespace-nowrap ${available === 0 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>剩 {available}</span></div></td>
                            <td className="p-4 text-sm text-slate-500 whitespace-nowrap"><span className="bg-slate-50 border border-slate-200 px-2 py-1 rounded">{item.categoryName}</span></td>
                            <td className="p-4 text-right sticky right-0 bg-white"><div className="flex justify-end gap-2"><button onClick={()=>openBorrowModal(item)} disabled={available <= 0} className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-all active:scale-95 whitespace-nowrap ${available <= 0 ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm'}`}><UserCheck className="w-3.5 h-3.5"/> {available <= 0 ? '缺貨' : '借出'}</button><button onClick={()=>openEquipModal(item)} className="p-2 text-slate-400 hover:text-teal-600"><Edit2 className="w-4 h-4"/></button><button onClick={()=>deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'equipment', item.id))} className="p-2 text-slate-400 hover:text-red-600"><Trash2 className="w-4 h-4"/></button></div></td>
                          </tr>
                        );
                      })}
                      {filteredEquipment.length===0 && <tr><td colSpan="4" className="p-12 text-center text-slate-400">無資料</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {viewMode === 'loans' && currentSession && (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-slate-200 max-w-[1600px] mx-auto flex flex-col max-h-[80vh]">
              <div className="p-4 border-b bg-slate-50 flex justify-between items-center sticky top-0 z-30"><h3 className="font-bold text-slate-700 flex items-center gap-2"><History className="w-5 h-5"/> 借用與歸還紀錄</h3><span className="text-xs bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-full font-bold">共 {loans.length} 筆</span></div>
              <div className="overflow-auto flex-1">
                <table className="w-full text-left text-sm min-w-[1000px] border-collapse">
                  <thead className="bg-slate-50 border-b uppercase text-slate-500 text-xs sticky top-0 z-20 shadow-sm"><tr><th className="p-4 font-semibold w-24 bg-slate-50">狀態</th><th className="p-4 font-semibold w-48 bg-slate-50">借用人</th><th className="p-4 font-semibold w-48 bg-slate-50">設備</th><th className="p-4 font-semibold w-64 bg-slate-50">用途</th><th className="p-4 font-semibold w-32 bg-slate-50">借用日</th><th className="p-4 font-semibold w-32 bg-slate-50">歸還日</th><th className="p-4 font-semibold text-right w-32 bg-slate-50 sticky right-0">動作</th></tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {loans.map(loan => (
                      <tr key={loan.id} className={loan.status === 'borrowed' ? 'bg-orange-50/30' : ''}>
                        <td className="p-4">{loan.status === 'borrowed' ? <span className="text-orange-700 bg-orange-100 px-2.5 py-1 rounded-full text-xs font-bold border border-orange-200 whitespace-nowrap">借用中</span> : <span className="text-green-700 bg-green-100 px-2.5 py-1 rounded-full text-xs font-bold border border-green-200 whitespace-nowrap">已歸還</span>}</td>
                        <td className="p-4"><div className="font-bold text-slate-700">{loan.borrower}</div><div className="text-xs text-slate-500 mt-0.5">{loan.phone}</div></td>
                        <td className="p-4 font-medium text-slate-800">{loan.equipmentName} <span className="ml-2 bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded text-xs font-mono">x{loan.quantity}</span></td>
                        <td className="p-4 text-slate-600 max-w-xs truncate" title={loan.purpose}>{loan.purpose || '-'}</td>
                        <td className="p-4 font-mono text-slate-500 whitespace-nowrap">{loan.borrowDate}</td>
                        <td className="p-4 font-mono text-slate-500 whitespace-nowrap">{loan.returnDate || '-'}</td>
                        <td className="p-4 text-right sticky right-0 bg-white">
                          {loan.status === 'borrowed' && <button onClick={()=>handleReturn(loan)} className="px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg text-xs font-bold shadow-md transition-all active:scale-95 whitespace-nowrap flex items-center gap-1 ml-auto"><CheckCircle className="w-3 h-3"/> 確認歸還</button>}
                        </td>
                      </tr>
                    ))}
                    {loans.length === 0 && <tr><td colSpan="7" className="p-12 text-center text-slate-400">無紀錄</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {viewMode === 'categories' && (
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-7xl mx-auto">
               {categories.map(c => (
                 <div key={c.id} className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex justify-between items-center group hover:border-teal-300 transition-colors">
                   <div className="flex items-center gap-3 overflow-hidden"><div className="w-8 h-8 rounded-full bg-teal-50 flex-shrink-0 flex items-center justify-center text-teal-600"><Hash className="w-4 h-4"/></div><span className="font-bold text-slate-700 truncate">{c.name}</span></div>
                   <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={()=>{setModalType('category');setEditItem(c);setCatForm({name:c.name});setIsModalOpen(true)}} className="p-1.5 text-slate-400 hover:text-teal-600"><Edit2 className="w-4 h-4"/></button><button onClick={()=>deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'categories', c.id))} className="p-1.5 text-slate-400 hover:text-red-600"><Trash2 className="w-4 h-4"/></button></div>
                 </div>
               ))}
               {categories.length === 0 && <div className="col-span-full text-center py-10 text-slate-400">尚未設定分類</div>}
             </div>
          )}
        </div>
      </main>

      {/* Modals */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between mb-6 border-b pb-3"><h3 className="text-xl font-bold text-slate-800">{modalType === 'session' ? '版次' : modalType === 'equipment' ? '設備' : modalType === 'category' ? '分類' : '借用'}管理</h3><button onClick={()=>setIsModalOpen(false)}><X className="w-6 h-6 text-slate-400 hover:text-slate-600"/></button></div>
            
            {modalType === 'session' && (
              <form onSubmit={handleSaveSession} className="space-y-4">
                <div><label className="text-sm font-bold text-slate-700 mb-1 block">版次名稱</label><input className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-teal-500 outline-none" value={sessionForm.name} onChange={e=>setSessionForm({...sessionForm, name:e.target.value})} placeholder="例如: 2023 上學期" required/></div>
                <div><label className="text-sm font-bold text-slate-700 mb-1 block">日期</label><input type="date" className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-teal-500 outline-none" value={sessionForm.date} onChange={e=>setSessionForm({...sessionForm, date:e.target.value})} required/></div>
                <button type="submit" className="w-full bg-teal-600 text-white py-3 rounded-xl font-bold hover:bg-teal-700 transition-colors">儲存</button>
              </form>
            )}

            {modalType === 'equipment' && (
              <form onSubmit={handleSaveEquipment} className="space-y-4">
                <div><label className="text-sm font-bold text-slate-700 mb-1 block">名稱</label><input className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-teal-500 outline-none" value={equipForm.name} onChange={e=>setEquipForm({...equipForm, name:e.target.value})} required/></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="text-sm font-bold text-slate-700 mb-1 block">數量</label><input type="number" className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-teal-500 outline-none" value={equipForm.quantity} onChange={e=>setEquipForm({...equipForm, quantity:e.target.value})} required/></div>
                  <div><label className="text-sm font-bold text-slate-700 mb-1 block">分類</label><select className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-teal-500 outline-none bg-white" value={equipForm.categoryId} onChange={e=>setEquipForm({...equipForm, categoryId:e.target.value})} required><option value="" disabled>選擇分類</option>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                </div>
                <div><label className="text-sm font-bold text-slate-700 mb-1 block">備註</label><input className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-teal-500 outline-none" value={equipForm.note} onChange={e=>setEquipForm({...equipForm, note:e.target.value})}/></div>
                <button type="submit" className="w-full bg-teal-600 text-white py-3 rounded-xl font-bold hover:bg-teal-700 transition-colors">儲存</button>
              </form>
            )}

            {modalType === 'category' && (
              <form onSubmit={handleSaveCategory} className="space-y-4">
                <div><label className="text-sm font-bold text-slate-700 mb-1 block">分類名稱</label><input className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-teal-500 outline-none" value={catForm.name} onChange={e=>setCatForm({...catForm, name:e.target.value})} required/></div>
                <button type="submit" className="w-full bg-teal-600 text-white py-3 rounded-xl font-bold hover:bg-teal-700 transition-colors">儲存</button>
              </form>
            )}

            {modalType === 'borrow' && (
              <form onSubmit={handleBorrow} className="space-y-4">
                <div className="bg-indigo-50 p-4 rounded-xl text-sm text-indigo-800 font-bold mb-4 flex items-center justify-between border border-indigo-100"><span className="flex items-center gap-2"><Box className="w-4 h-4"/> {borrowForm.equipmentName}</span><span className="bg-white px-2 py-0.5 rounded text-indigo-600 text-xs">庫存: {borrowForm.maxQuantity}</span></div>
                <div><label className="text-sm font-bold text-slate-700 mb-1 block">借用數量</label><input type="number" min="1" max={borrowForm.maxQuantity} className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none" value={borrowForm.quantity} onChange={e=>setBorrowForm({...borrowForm, quantity:e.target.value})} required /></div>
                <div><label className="text-sm font-bold text-slate-700 mb-1 block">借用日期</label><input type="date" className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none" value={borrowForm.date} onChange={e=>setBorrowForm({...borrowForm, date:e.target.value})} required/></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="text-sm font-bold text-slate-700 mb-1 block">借用人姓名</label><input className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none" value={borrowForm.borrower} onChange={e=>setBorrowForm({...borrowForm, borrower:e.target.value})} required/></div>
                  <div><label className="text-sm font-bold text-slate-700 mb-1 block">聯絡電話</label><input type="tel" className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none" value={borrowForm.phone} onChange={e=>setBorrowForm({...borrowForm, phone:e.target.value})} required/></div>
                </div>
                <div><label className="text-sm font-bold text-slate-700 mb-1 block">借用用途</label><textarea className="w-full border border-slate-300 rounded-lg p-2.5 h-20 resize-none focus:ring-2 focus:ring-indigo-500 outline-none" value={borrowForm.purpose} onChange={e=>setBorrowForm({...borrowForm, purpose:e.target.value})} required/></div>
                <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">確認借出</button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}