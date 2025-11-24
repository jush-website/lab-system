import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged, 
  signOut,
  signInWithCustomToken,
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
  writeBatch,
  getDocs
} from 'firebase/firestore';
import { 
  Beaker, ClipboardList, Settings, LogOut, Plus, Search, Trash2, Edit2, 
  Download, Filter, AlertTriangle, User, LayoutGrid, Menu, X, CheckCircle, 
  AlertCircle, Eye, EyeOff, ChevronRight, UserPlus, Calendar, FolderOpen,
  History, UserCheck, Phone, ArrowLeft, Clock, FileText, Hash, Home, 
  Activity, Box, FileDown, ArrowUpRight, ArrowDownLeft, MousePointerClick, Sparkles, MoreVertical, Timer, ShoppingCart, Minus, ArrowUpDown, Copy
} from 'lucide-react';

// ==========================================
// 🟢 您的 Firebase 設定
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
  useEffect(() => { const timer = setTimeout(onClose, 1000); return () => clearTimeout(timer); }, [onClose]);
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
          <h1 className="text-2xl font-bold text-slate-800">實驗室設備管理系統</h1>
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
  
  // Navigation State
  const [viewMode, setViewMode] = useState('dashboard'); 
  const [currentSession, setCurrentSession] = useState(null); 

  // Data State
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
  const [sortOption, setSortOption] = useState('name');
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', action: null });
  
  // Modals State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState(''); 
  const [editItem, setEditItem] = useState(null);
  
  // Forms State
  const [sessionForm, setSessionForm] = useState({ name: '', date: '', copyFromPrevious: false });
  const [equipForm, setEquipForm] = useState({ name: '', quantity: 1, categoryId: '', note: '' });
  const [catForm, setCatForm] = useState({ name: '' });
  const [cartItems, setCartItems] = useState([]);
  const [borrowForm, setBorrowForm] = useState({ 
    borrower: '', phone: '', date: new Date().toISOString().slice(0,10), purpose: '', borrowDays: 7 
  });

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

  // Dashboard Logic
  useEffect(() => {
    if (!user || viewMode !== 'dashboard') return;
    if (sessions.length === 0) {
        setDashboardStats({ latestSessionId: null, latestSessionName: '尚無版次', totalEquipment: 0, totalBorrowed: 0, lowStockCount: 0, recentActivity: [] });
        return;
    }
    const latestSession = sessions[0];
    const targetSessionId = latestSession.id;

    const qEquip = query(collection(db, 'artifacts', appId, 'public', 'data', 'equipment'), where('sessionId', '==', targetSessionId));
    const unsubEquip = onSnapshot(qEquip, (snap) => {
      let equipCount = 0, borrowedCount = 0, lowStock = 0;
      snap.forEach(doc => {
        const data = doc.data();
        equipCount += (data.quantity || 0);
        borrowedCount += (data.borrowedCount || 0);
        if ((data.quantity - (data.borrowedCount || 0)) < 3) lowStock++;
      });
      setDashboardStats(prev => ({ ...prev, latestSessionId: targetSessionId, latestSessionName: latestSession.name, totalEquipment: equipCount, totalBorrowed: borrowedCount, lowStockCount: lowStock }));
    });

    const qLoans = query(collection(db, 'artifacts', appId, 'public', 'data', 'loans'), where('sessionId', '==', targetSessionId));
    const unsubLoans = onSnapshot(qLoans, (snap) => {
      const events = [];
      snap.forEach(doc => {
        const data = doc.data();
        const loanId = doc.id;
        events.push({
          id: loanId + '_borrow',
          originalId: loanId,
          sessionId: data.sessionId,
          type: 'borrow',
          date: data.borrowDate,
          borrower: data.borrower,
          equipmentName: data.equipmentName,
          quantity: data.quantity,
          timestamp: data.createdAt ? data.createdAt.seconds : 0
        });
        if (data.status === 'returned' && data.returnDate) {
          events.push({
            id: loanId + '_return',
            originalId: loanId,
            sessionId: data.sessionId,
            type: 'return',
            date: data.returnDate,
            borrower: data.borrower,
            equipmentName: data.equipmentName,
            quantity: data.quantity,
            timestamp: data.updatedAt ? data.updatedAt.seconds : (data.createdAt ? data.createdAt.seconds + 86400 : Date.now()/1000) 
          });
        }
      });
      events.sort((a, b) => {
        if (a.date > b.date) return -1;
        if (a.date < b.date) return 1;
        return b.timestamp - a.timestamp;
      });
      setDashboardStats(prev => ({ ...prev, recentActivity: events.slice(0, 10) }));
    });
    return () => { unsubEquip(); unsubLoans(); };
  }, [user, viewMode, sessions]); 

  // Session Data
  useEffect(() => {
    if (!user || !currentSession) return;
    const qEquip = query(collection(db, 'artifacts', appId, 'public', 'data', 'equipment'), where('sessionId', '==', currentSession.id));
    const unsubEquip = onSnapshot(qEquip, snap => setEquipment(snap.docs.map(d => ({id: d.id, ...d.data()}))));
    
    const qLoan = query(collection(db, 'artifacts', appId, 'public', 'data', 'loans'), where('sessionId', '==', currentSession.id));
    const unsubLoans = onSnapshot(qLoan, snap => {
      const list = snap.docs.map(d => ({id: d.id, ...d.data()}));
      list.sort((a, b) => (a.borrowDate > b.borrowDate ? -1 : 1));
      setLoans(list);
    });
    return () => { unsubEquip(); unsubLoans(); };
  }, [user, currentSession]);

  const showToast = (msg, type='success') => setToast({message: msg, type});
  const getAvailability = (item) => (item.quantity - (item.borrowedCount || 0));

  // Cart Helpers
  const addToCart = (item) => {
    const existing = cartItems.find(c => c.id === item.id);
    const available = getAvailability(item);
    if(available <= 0) { showToast("此設備已無庫存", "error"); return; }
    if (existing) {
      if (existing.borrowQty < available) setCartItems(cartItems.map(c => c.id === item.id ? { ...c, borrowQty: c.borrowQty + 1 } : c));
      else showToast("已達最大可借數量", "error");
    } else {
      setCartItems([...cartItems, { ...item, borrowQty: 1, maxQty: available }]);
    }
  };

  const removeFromCart = (id) => {
    setCartItems(cartItems.filter(c => c.id !== id));
  };
  
  const updateCartQty = (id, delta) => {
    setCartItems(cartItems.map(c => {
      if(c.id === id) {
        const newQty = c.borrowQty + delta;
        if(newQty > 0 && newQty <= c.maxQty) return {...c, borrowQty: newQty};
      }
      return c;
    }));
  };

  // Direct input for cart qty
  const handleCartQtyInput = (id, val) => {
      const newQty = parseInt(val);
      setCartItems(cartItems.map(c => {
          if(c.id === id) {
              if(isNaN(newQty) || newQty < 1) return {...c, borrowQty: 1};
              if(newQty > c.maxQty) {
                  showToast(`庫存不足 (上限: ${c.maxQty})`, "error");
                  return {...c, borrowQty: c.maxQty};
              }
              return {...c, borrowQty: newQty};
          }
          return c;
      }));
  };

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

  const handleExportCSV = async (sessionToExport = currentSession) => {
    if (!sessionToExport) return;

    let itemsToExport = [];

    if (currentSession && sessionToExport.id === currentSession.id) {
        itemsToExport = equipment;
    } else {
        try {
            const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'equipment'), where('sessionId', '==', sessionToExport.id));
            const snapshot = await getDocs(q);
            itemsToExport = snapshot.docs.map(d => d.data());
        } catch (e) {
            showToast("匯出失敗", "error");
            return;
        }
    }

    if (!itemsToExport.length) { showToast("此版次無資料可匯出", "error"); return; }
    
    const headers = ["設備名稱", "分類", "總數量", "已借出", "剩餘庫存", "備註"];
    const rows = itemsToExport.map(item => {
      const borrowed = item.borrowedCount || 0;
      const remaining = item.quantity - borrowed;
      return [
        `"${item.name.replace(/"/g, '""')}"`,
        `"${item.categoryName}"`,
        item.quantity,
        borrowed,
        remaining,
        `"${(item.note || "").replace(/"/g, '""')}"`
      ].join(",");
    });

    const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${sessionToExport.name}_設備清單.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("CSV 下載已開始");
  };

  // CRUD Handlers
  const handleSaveSession = async (e) => {
    e.preventDefault();
    try {
      const basePayload = {
        name: sessionForm.name,
        date: sessionForm.date,
        createdBy: user.uid
      };
      
      let newSessionRef;

      if (editItem) {
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'sessions', editItem.id), {
          ...basePayload,
          updatedAt: serverTimestamp()
        });
        showToast("版次已更新");
      } else {
        newSessionRef = await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'sessions'), {
          ...basePayload,
          createdAt: serverTimestamp()
        });
        
        if (sessionForm.copyFromPrevious && sessions.length > 0) {
             const latestSession = sessions[0];
             const qSource = query(collection(db, 'artifacts', appId, 'public', 'data', 'equipment'), where('sessionId', '==', latestSession.id));
             const sourceDocs = await getDocs(qSource);
             
             const batch = writeBatch(db);
             let count = 0;
             
             sourceDocs.forEach(docSnap => {
                 const data = docSnap.data();
                 const newRef = doc(collection(db, 'artifacts', appId, 'public', 'data', 'equipment'));
                 batch.set(newRef, {
                     ...data,
                     sessionId: newSessionRef.id,
                     borrowedCount: 0,
                     updatedAt: serverTimestamp(),
                     createdAt: serverTimestamp()
                 });
                 count++;
             });
             
             if (count > 0) await batch.commit();
             showToast(`已建立版次並複製 ${count} 項設備`);
        } else {
             showToast("版次建立成功");
        }
      }
      setIsModalOpen(false);
    } catch (err) { 
        console.error(err);
        showToast("錯誤", "error"); 
    }
  };
  
  const deleteSession = (id) => {
    setConfirmDialog({
      isOpen: true, title: "刪除版次", message: "確定要刪除此版次嗎？", isDangerous: true, action: async () => { await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'sessions', id)); setConfirmDialog(p => ({...p, isOpen: false})); showToast("版次已刪除"); }
    });
  };

  const handleSaveEquipment = async (e) => { e.preventDefault(); if (!currentSession) return; try { const cat = categories.find(c => c.id === equipForm.categoryId); const payload = { name: equipForm.name, quantity: parseInt(equipForm.quantity), categoryId: equipForm.categoryId, categoryName: cat ? cat.name : '未分類', note: equipForm.note, sessionId: currentSession.id, ...(editItem ? {} : { borrowedCount: 0 }), updatedAt: serverTimestamp() }; if (editItem) await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'equipment', editItem.id), payload); else await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'equipment'), payload); setIsModalOpen(false); showToast("設備儲存成功"); } catch (err) { showToast("錯誤", "error"); } };
  const handleSaveCategory = async (e) => { e.preventDefault(); try { if (editItem) await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'categories', editItem.id), {name: catForm.name}); else await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'categories'), {name: catForm.name}); setIsModalOpen(false); showToast("分類儲存成功"); } catch (err) { showToast("錯誤", "error"); } };
  const handleDeleteCategory = (id) => { setConfirmDialog({ isOpen: true, title: "刪除分類", message: "確定要刪除此分類嗎？", isDangerous: true, action: async () => { await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'categories', id)); setConfirmDialog(p => ({...p, isOpen: false})); showToast("分類已刪除"); } }); };

  const handleBatchBorrow = async (e) => { 
    e.preventDefault(); if (!currentSession) return; 
    if (cartItems.length === 0) { showToast("請先選擇設備加入借用清單", "error"); return; }
    const days = parseInt(borrowForm.borrowDays);
    if (days <= 0) { showToast("借用天數錯誤", "error"); return; }

    try { 
      const promises = cartItems.map(async (item) => {
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'loans'), { 
          sessionId: currentSession.id, equipmentId: item.id, equipmentName: item.name, borrower: borrowForm.borrower, phone: borrowForm.phone, purpose: borrowForm.purpose, quantity: item.borrowQty, borrowDays: days, borrowDate: borrowForm.date, returnDate: null, status: 'borrowed', createdAt: serverTimestamp(), updatedAt: serverTimestamp() 
        }); 
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'equipment', item.id), { borrowedCount: increment(item.borrowQty) }); 
      });
      await Promise.all(promises);
      setCartItems([]); setBorrowForm({ borrower: '', phone: '', date: new Date().toISOString().slice(0,10), purpose: '', borrowDays: 7 }); showToast(`成功借出 ${cartItems.length} 項設備`); setViewMode('loans'); 
    } catch (err) { showToast("借用失敗", "error"); } 
  };

  const handleReturn = (loanId) => { setConfirmDialog({ isOpen: true, title: "歸還確認", message: `確定此設備已歸還嗎？`, isDangerous: false, action: async () => { try { const loanDoc = loans.find(l => l.id === loanId); if (!loanDoc) return; await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'loans', loanId), { returnDate: new Date().toISOString().split('T')[0], status: 'returned', updatedAt: serverTimestamp() }); await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'equipment', loanDoc.equipmentId), { borrowedCount: increment(-loanDoc.quantity) }); setConfirmDialog(p => ({...p, isOpen: false})); showToast("歸還完成"); } catch (err) { showToast("操作失敗", "error"); } } }); };
  
  // Filtering & Sorting
  const filteredEquipment = useMemo(() => {
    const result = equipment.filter(item => {
      const matchSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCat = selectedCategoryFilter === 'all' || item.categoryId === selectedCategoryFilter;
      return matchSearch && matchCat;
    });
    result.sort((a, b) => {
      switch (sortOption) {
        case 'quantity_desc': return b.quantity - a.quantity;
        case 'quantity_asc': return a.quantity - b.quantity;
        case 'created_desc': 
          const tA = a.updatedAt?.seconds || 0;
          const tB = b.updatedAt?.seconds || 0;
          return tB - tA;
        case 'name':
        default: return a.name.localeCompare(b.name, 'zh-Hant');
      }
    });
    return result;
  }, [equipment, searchTerm, selectedCategoryFilter, sortOption]);

  const openSessionModal = (item=null) => { 
      setModalType('session'); 
      setEditItem(item); 
      setSessionForm({
          name: item ? item.name : '', 
          date: item ? item.date : new Date().toISOString().slice(0,10),
          copyFromPrevious: false 
      }); 
      setIsModalOpen(true); 
  };
  const openEquipModal = (item=null) => { setModalType('equipment'); setEditItem(item); setEquipForm(item ? {name: item.name, quantity: item.quantity, categoryId: item.categoryId, note: item.note} : {name: '', quantity: 1, categoryId: categories[0]?.id || '', note: ''}); setIsModalOpen(true); };
  const getExpectedReturnDate = (dateStr, days) => { if(!dateStr || !days) return ''; const d = new Date(dateStr); d.setDate(d.getDate() + parseInt(days)); return d.toISOString().slice(0,10); };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-teal-600 font-medium">系統載入中...</div>;
  if (!user) return <AuthScreen />;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row text-slate-800 font-sans">
      <ConfirmModal isOpen={confirmDialog.isOpen} title={confirmDialog.title} message={confirmDialog.message} onConfirm={confirmDialog.action} onCancel={()=>setConfirmDialog(p=>({...p, isOpen:false}))} isDangerous={confirmDialog.isDangerous} />
      {toast && <Toast message={toast.message} type={toast.type} onClose={()=>setToast(null)} />}

      {/* Sidebar */}
      <aside className={`fixed md:relative z-30 w-64 bg-teal-800 text-teal-50 h-screen transition-transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 flex flex-col shadow-2xl`}>
        <div className="p-6 bg-teal-900/40">
          <h1 className="text-xl font-bold flex items-center gap-2"><Beaker/> 實驗室設備管理系統</h1>
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <button onClick={() => { setViewMode('dashboard'); setCurrentSession(null); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${viewMode === 'dashboard' ? 'bg-teal-600 text-white shadow-lg' : 'hover:bg-teal-700/50'}`}>
            <Home className="w-5 h-5" /> <span className="font-medium">首頁概覽</span>
          </button>
          <button onClick={() => { setViewMode('sessions'); setCurrentSession(null); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${viewMode === 'sessions' ? 'bg-teal-600 text-white shadow-lg' : 'hover:bg-teal-700/50'}`}>
            <FolderOpen className="w-5 h-5" /> <span className="font-medium">版次/清單總覽</span>
          </button>
          <button onClick={() => { setViewMode('categories'); setCurrentSession(null); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${viewMode === 'categories' ? 'bg-teal-600 text-white shadow-lg' : 'hover:bg-teal-700/50'}`}>
            <Settings className="w-5 h-5" /> <span className="font-medium">全域分類設定</span>
          </button>
          {currentSession && (
            <div className="mt-6 pt-6 border-t border-teal-700/50">
              <p className="px-4 text-xs font-bold text-teal-300 uppercase mb-2">當前版次：{currentSession.name}</p>
              <button onClick={() => { setViewMode('equipment'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${viewMode === 'equipment' ? 'bg-teal-500 text-white shadow-lg' : 'hover:bg-teal-700/50'}`}>
                <LayoutGrid className="w-5 h-5" /> <span className="font-medium">設備列表</span>
              </button>
              <button onClick={() => { setViewMode('borrow-request'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${viewMode === 'borrow-request' ? 'bg-teal-500 text-white shadow-lg' : 'hover:bg-teal-700/50'}`}>
                <ShoppingCart className="w-5 h-5" /> <span className="font-medium">借用登記</span>
              </button>
              <button onClick={() => { setViewMode('loans'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${viewMode === 'loans' ? 'bg-teal-500 text-white shadow-lg' : 'hover:bg-teal-700/50'}`}>
                <History className="w-5 h-5" /> <span className="font-medium">借還紀錄表</span>
              </button>
            </div>
          )}
        </nav>
        <div className="p-4 border-t border-teal-700">
           <button onClick={()=>signOut(auth)} className="flex items-center gap-2 text-sm text-red-200 hover:text-white"><LogOut className="w-4 h-4"/> 登出</button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="bg-white shadow-sm p-4 flex items-center justify-between z-20">
          <div className="flex items-center gap-4">
             <button onClick={()=>setIsSidebarOpen(!isSidebarOpen)} className="md:hidden p-2"><Menu/></button>
             <div>
                <h2 className="text-2xl font-bold text-slate-800">
                  {viewMode === 'sessions' && '版次管理'}
                  {viewMode === 'categories' && '分類設定'}
                  {currentSession && viewMode === 'equipment' && `${currentSession.name} - 設備清單`}
                  {currentSession && viewMode === 'borrow-request' && `${currentSession.name} - 借用登記`}
                  {currentSession && viewMode === 'loans' && `${currentSession.name} - 借還紀錄`}
                </h2>
                {currentSession && (
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <Clock className="w-3 h-3"/> 建立日期: {currentSession.date}
                  </p>
                )}
             </div>
          </div>
          <div className="flex gap-2">
            {viewMode === 'sessions' && <button onClick={()=>openSessionModal()} className="bg-teal-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-teal-700"><Plus className="w-4 h-4"/> 新增版次</button>}
            {viewMode === 'equipment' && (
                <>
                <button onClick={()=>handleExportCSV()} className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-slate-50 shadow-sm transition-all active:scale-95"><FileDown className="w-4 h-4 text-teal-600"/> <span className="hidden sm:inline">匯出 CSV</span></button>
                <button onClick={()=>openEquipModal()} className="bg-teal-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-teal-700"><Plus className="w-4 h-4"/> 新增設備</button>
                </>
            )}
            {viewMode === 'categories' && <button onClick={()=>{setModalType('category');setEditItem(null);setCatForm({name:''});setIsModalOpen(true)}} className="bg-teal-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-teal-700"><Plus className="w-4 h-4"/> 新增分類</button>}
          </div>
        </header>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
          
          {/* 1. SESSIONS VIEW */}
          {viewMode === 'sessions' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sessions.map(sess => (
                <div key={sess.id} className="bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-all cursor-pointer group relative overflow-hidden">
                  <div onClick={() => { setCurrentSession(sess); setViewMode('equipment'); }} className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-teal-50 rounded-lg text-teal-600"><Calendar className="w-6 h-6"/></div>
                      <span className="text-xs font-mono text-slate-400">{sess.date}</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-1">{sess.name}</h3>
                    <p className="text-sm text-slate-500">點擊進入管理設備與借用</p>
                  </div>
                  <div className="bg-slate-50 px-6 py-3 border-t flex justify-between items-center">
                    <span className="text-xs text-slate-400">ID: {sess.id.slice(0,6)}</span>
                    <div className="flex gap-2">
                      <button 
                        onClick={(e)=>{e.stopPropagation(); handleExportCSV(sess);}} 
                        className="p-2 text-slate-400 hover:text-teal-600 transition-colors" 
                        title="匯出 CSV"
                      >
                        <FileDown className="w-4 h-4"/>
                      </button>
                      <button onClick={(e)=>{e.stopPropagation();openSessionModal(sess)}} className="p-2 text-slate-400 hover:text-teal-600"><Edit2 className="w-4 h-4"/></button>
                      <button onClick={(e)=>{e.stopPropagation();deleteSession(sess.id)}} className="p-2 text-slate-400 hover:text-red-600"><Trash2 className="w-4 h-4"/></button>
                    </div>
                  </div>
                </div>
              ))}
              {sessions.length === 0 && <div className="col-span-full text-center py-20 text-slate-400">尚未建立任何版次，請點擊右上角新增。</div>}
            </div>
          )}

          {/* ... [Other Views: Dashboard, Equipment, Loans, etc.] ... */}
          {/* DASHBOARD */}
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
                  <div className="flex items-center justify-between mb-4"><h3 className="font-bold text-lg text-slate-800 flex items-center gap-2"><History className="w-5 h-5 text-teal-600"/> {dashboardStats.latestSessionName} - 最新動態</h3></div>
                  <div className="flex-1 overflow-auto">
                    <table className="w-full text-left min-w-[500px]">
                      <thead className="text-slate-400 text-xs uppercase bg-slate-50 sticky top-0 z-10"><tr><th className="p-3">日期</th><th className="p-3">動作</th><th className="p-3">借用人</th><th className="p-3">物品</th></tr></thead>
                      <tbody className="divide-y divide-slate-50 text-sm">
                        {dashboardStats.recentActivity.map(item => (
                          <tr key={item.id} onClick={() => handleActivityClick(item)} className="hover:bg-slate-50/80 cursor-pointer transition-colors group">
                            <td className="p-3 text-slate-500">{item.date}</td>
                            <td className="p-3">{item.type === 'borrow' ? <span className="flex items-center gap-1 text-orange-600 bg-orange-50 px-2 py-0.5 rounded text-xs w-fit font-bold border border-orange-100"><ArrowUpRight className="w-3 h-3"/> 借出</span> : <span className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-0.5 rounded text-xs w-fit font-bold border border-green-100"><ArrowDownLeft className="w-3 h-3"/> 歸還</span>}</td>
                            <td className="p-3 font-medium text-slate-700">{item.borrower}</td>
                            <td className="p-3 group-hover:text-teal-600 transition-colors">{item.equipmentName} <span className="text-xs bg-slate-100 px-1 rounded text-slate-500">x{item.quantity}</span></td>
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

          {/* 2. EQUIPMENT VIEW */}
          {viewMode === 'equipment' && currentSession && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-xl shadow-sm">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4"/>
                  <input type="text" placeholder="搜尋設備..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-teal-500"/>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
                    <select value={selectedCategoryFilter} onChange={e=>setSelectedCategoryFilter(e.target.value)} className="border rounded-lg px-4 py-2 outline-none bg-white min-w-[120px]">
                      <option value="all">所有分類</option>
                      {categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <div className="relative">
                        <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <select value={sortOption} onChange={e=>setSortOption(e.target.value)} className="border rounded-lg pl-10 pr-4 py-2 outline-none bg-white min-w-[140px]">
                            <option value="name">名稱排序</option>
                            <option value="quantity_desc">數量 (多→少)</option>
                            <option value="quantity_asc">數量 (少→多)</option>
                            <option value="created_desc">最新建立</option>
                        </select>
                    </div>
                </div>
              </div>

              {/* Mobile Card View */}
              <div className="block md:hidden space-y-4">
                {filteredEquipment.map(item => {
                  const borrowed = item.borrowedCount || 0; 
                  const available = item.quantity - borrowed;
                  return (
                    <div key={item.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-bold text-lg text-slate-800">{item.name}</h3>
                          <span className="inline-block bg-slate-100 text-slate-500 text-xs px-2 py-1 rounded mt-1">{item.categoryName}</span>
                        </div>
                        <div className="flex gap-2">
                           <button onClick={()=>openEquipModal(item)} className="p-2 text-slate-400 hover:text-teal-600"><Edit2 className="w-4 h-4"/></button>
                           <button onClick={()=>deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'equipment', item.id))} className="p-2 text-slate-400 hover:text-red-600"><Trash2 className="w-4 h-4"/></button>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 mb-4 text-center bg-slate-50 rounded-lg p-2 text-sm">
                        <div><div className="text-slate-400 text-xs">總數</div><div className="font-bold">{item.quantity}</div></div>
                        <div><div className="text-slate-400 text-xs">借出</div><div className="font-bold text-orange-600">{borrowed}</div></div>
                        <div><div className="text-slate-400 text-xs">剩餘</div><div className={`font-bold ${available===0?'text-red-600':'text-green-600'}`}>{available}</div></div>
                      </div>
                      {item.note && <div className="text-xs text-slate-400 mb-3 bg-yellow-50 p-2 rounded border border-yellow-100">📝 {item.note}</div>}
                      <button 
                        onClick={()=>addToCart(item)} 
                        disabled={available <= 0}
                        className={`w-full py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 ${available <= 0 ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md'}`}
                      >
                        <Plus className="w-4 h-4"/> {available <= 0 ? '無庫存' : '加入借用登記'}
                      </button>
                    </div>
                  );
                })}
                {filteredEquipment.length===0 && <div className="text-center py-10 text-slate-400">無資料</div>}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block bg-white rounded-xl shadow-sm overflow-hidden border border-slate-200">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b">
                    <tr>
                      <th className="p-4 font-semibold text-slate-600">設備名稱</th>
                      <th className="p-4 font-semibold text-slate-600">庫存狀態</th>
                      <th className="p-4 font-semibold text-slate-600">分類</th>
                      <th className="p-4 font-semibold text-slate-600 text-right">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredEquipment.map(item => {
                        const borrowed = item.borrowedCount || 0;
                        const available = item.quantity - borrowed;
                        return (
                      <tr key={item.id} className="hover:bg-teal-50/30">
                        <td className="p-4 font-medium">{item.name} <span className="text-xs text-slate-400 block">{item.note}</span></td>
                        <td className="p-4"><div className="flex items-center gap-2"><span className="font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">總 {item.quantity}</span><span className="text-xs text-slate-400">→</span><span className="text-orange-600 bg-orange-50 px-2 py-0.5 rounded text-xs font-bold">借 {borrowed}</span><span className={`px-2 py-0.5 rounded text-xs font-bold ${available === 0 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>剩 {available}</span></div></td>
                        <td className="p-4 text-sm text-slate-500">{item.categoryName}</td>
                        <td className="p-4 text-right flex justify-end gap-2"><button onClick={()=>addToCart(item)} className="px-3 py-1 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded text-sm font-medium flex items-center gap-1"><Plus className="w-3 h-3"/> 加入借用</button><button onClick={()=>openEquipModal(item)} className="p-2 text-slate-400 hover:text-teal-600"><Edit2 className="w-4 h-4"/></button><button onClick={()=>deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'equipment', item.id))} className="p-2 text-slate-400 hover:text-red-600"><Trash2 className="w-4 h-4"/></button></td>
                      </tr>
                    )})}
                    {filteredEquipment.length === 0 && <tr><td colSpan="4" className="p-8 text-center text-slate-400">無資料</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 🟢 [NEW] BORROW REQUEST VIEW (Shopping Cart Style) */}
          {viewMode === 'borrow-request' && currentSession && (
             <div className="flex flex-col lg:flex-row gap-6 h-full overflow-hidden">
                {/* Left: Equipment List for Selection */}
                <div className="flex-1 lg:w-7/12 flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden h-[45%] lg:h-full min-h-[300px]">
                   <div className="p-4 border-b bg-slate-50 shrink-0">
                      <h3 className="font-bold text-slate-700 mb-2 flex items-center gap-2"><Search className="w-4 h-4"/> 搜尋可用設備</h3>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4"/>
                        <input type="text" placeholder="輸入名稱搜尋..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-teal-500"/>
                      </div>
                   </div>
                   <div className="flex-1 overflow-y-auto p-2 space-y-2 max-h-[300px] md:max-h-full">
                      {filteredEquipment.map(item => {
                        const available = getAvailability(item);
                        if(available <= 0) return null; 
                        return (
                          <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100 hover:border-teal-300 transition-colors">
                             <div>
                                <div className="font-bold text-slate-700">{item.name}</div>
                                <div className="text-xs text-slate-500">分類: {item.categoryName} | 庫存: <span className="text-teal-600 font-bold">{available}</span></div>
                             </div>
                             <button onClick={()=>addToCart(item)} className="bg-teal-600 text-white p-2 rounded-full hover:bg-teal-700 shadow-sm active:scale-95"><Plus className="w-4 h-4"/></button>
                          </div>
                        );
                      })}
                      {filteredEquipment.filter(i => getAvailability(i) > 0).length === 0 && <div className="text-center p-10 text-slate-400">無可用設備</div>}
                   </div>
                </div>

                {/* Right: Cart & Form */}
                <div className="flex-1 lg:w-5/12 flex flex-col gap-4 overflow-y-auto h-[55%] lg:h-full">
                   {/* Cart List */}
                   <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 shrink-0">
                      <h3 className="font-bold text-slate-700 mb-3 flex items-center gap-2"><ShoppingCart className="w-5 h-5 text-indigo-600"/> 借用清單 ({cartItems.length})</h3>
                      {cartItems.length === 0 ? (
                        <div className="text-center py-4 text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-300 text-sm">
                          尚未選擇任何設備<br/>請從列表點擊 + 加入
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                           {cartItems.map(item => (
                             <div key={item.id} className="flex items-center justify-between p-2 bg-indigo-50 rounded-lg border border-indigo-100">
                                <div className="flex-1 min-w-0 pr-2">
                                   <div className="font-bold text-indigo-900 truncate">{item.name}</div>
                                   <div className="text-xs text-indigo-600">上限: {item.maxQty}</div>
                                </div>
                                <div className="flex items-center gap-1">
                                   <button onClick={()=>updateCartQty(item.id, -1)} className="p-1 bg-white rounded text-indigo-600 hover:bg-indigo-200"><Minus className="w-3 h-3"/></button>
                                   {/* Input for quantity */}
                                   <input 
                                      type="number" 
                                      className="w-10 text-center border border-indigo-200 rounded text-sm py-0.5 focus:ring-1 focus:ring-indigo-500 outline-none"
                                      value={item.borrowQty}
                                      onChange={(e) => handleCartQtyInput(item.id, e.target.value)}
                                      min="1"
                                      max={item.maxQty}
                                   />
                                   <button onClick={()=>updateCartQty(item.id, 1)} className="p-1 bg-white rounded text-indigo-600 hover:bg-indigo-200"><Plus className="w-3 h-3"/></button>
                                   <button onClick={()=>removeFromCart(item.id)} className="p-1 text-red-500 hover:bg-red-100 rounded ml-1"><X className="w-4 h-4"/></button>
                                </div>
                             </div>
                           ))}
                        </div>
                      )}
                   </div>

                   {/* Borrower Form */}
                   <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex-1 min-h-0 overflow-y-auto">
                      <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><UserCheck className="w-5 h-5 text-indigo-600"/> 借用人資訊</h3>
                      <form onSubmit={handleBatchBorrow} className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div><label className="text-xs font-bold text-slate-600 block mb-1">姓名</label><input className="w-full border rounded p-2 text-sm" value={borrowForm.borrower} onChange={e=>setBorrowForm({...borrowForm, borrower:e.target.value})} required/></div>
                          <div><label className="text-xs font-bold text-slate-600 block mb-1">電話</label><input type="tel" className="w-full border rounded p-2 text-sm" value={borrowForm.phone} onChange={e=>setBorrowForm({...borrowForm, phone:e.target.value})} required/></div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                           <div><label className="text-xs font-bold text-slate-600 block mb-1">借用日期</label><input type="date" className="w-full border rounded p-2 text-sm" value={borrowForm.date} onChange={e=>setBorrowForm({...borrowForm, date:e.target.value})} required/></div>
                           <div>
                             <label className="text-xs font-bold text-slate-600 block mb-1">預計天數</label>
                             <div className="relative">
                               <input type="number" min="1" className="w-full border rounded p-2 pr-8 text-sm" value={borrowForm.borrowDays} onChange={e=>setBorrowForm({...borrowForm, borrowDays:e.target.value})} required/>
                               <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">天</span>
                             </div>
                           </div>
                        </div>
                        {borrowForm.date && borrowForm.borrowDays && (
                           <div className="text-xs text-indigo-600 flex items-center gap-1 bg-indigo-50 p-2 rounded">
                             <Timer className="w-3 h-3"/> 預計歸還：{getExpectedReturnDate(borrowForm.date, borrowForm.borrowDays)}
                           </div>
                        )}
                        <div><label className="text-xs font-bold text-slate-600 block mb-1">用途說明</label><textarea className="w-full border rounded p-2 h-16 resize-none text-sm" value={borrowForm.purpose} onChange={e=>setBorrowForm({...borrowForm, purpose:e.target.value})} required/></div>
                        
                        <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 mt-2">
                           確認借出 ({cartItems.length} 項物品)
                        </button>
                      </form>
                   </div>
                </div>
             </div>
          )}

          {/* 3. LOAN HISTORY VIEW */}
          {viewMode === 'loans' && currentSession && (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-slate-200">
              <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
                <h3 className="font-bold text-slate-700">借用與歸還紀錄</h3>
                <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">共 {loans.length} 筆紀錄</span>
              </div>
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="p-4 font-semibold text-slate-600">狀態</th>
                    <th className="p-4 font-semibold text-slate-600">借用人</th>
                    <th className="p-4 font-semibold text-slate-600">設備</th>
                    <th className="p-4 font-semibold text-slate-600">用途</th>
                    <th className="p-4 font-semibold text-slate-600">天數</th>
                    <th className="p-4 font-semibold text-slate-600">借用日期</th>
                    <th className="p-4 font-semibold text-slate-600">歸還日期</th>
                    <th className="p-4 font-semibold text-slate-600 text-right">動作</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {loans.map(loan => (
                    <tr key={loan.id} className={loan.status === 'borrowed' ? 'bg-orange-50/50' : ''}>
                      <td className="p-4">
                        {loan.status === 'borrowed' 
                          ? <span className="text-orange-600 bg-orange-100 px-2 py-1 rounded text-xs font-bold">借用中</span>
                          : <span className="text-green-600 bg-green-100 px-2 py-1 rounded text-xs font-bold">已歸還</span>
                        }
                      </td>
                      <td className="p-4">
                        <div className="font-medium">{loan.borrower}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-1"><Phone className="w-3 h-3"/> {loan.phone}</div>
                      </td>
                      <td className="p-4 font-medium">{loan.equipmentName}</td>
                      <td className="p-4 text-slate-600">{loan.purpose || '-'}</td>
                      <td className="p-4 text-slate-600">{loan.borrowDays || 7}</td>
                      <td className="p-4">{loan.borrowDate}</td>
                      <td className="p-4">{loan.returnDate || '-'}</td>
                      <td className="p-4 text-right">
                        {loan.status === 'borrowed' && (
                          <button onClick={()=>handleReturn(loan.id)} className="px-3 py-1 bg-green-600 text-white hover:bg-green-700 rounded text-xs font-bold shadow-sm">
                            確認歸還
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {loans.length === 0 && <tr><td colSpan="8" className="p-8 text-center text-slate-400">目前無借用紀錄</td></tr>}
                </tbody>
              </table>
            </div>
          )}

          {/* 4. CATEGORIES VIEW (Simple) */}
          {viewMode === 'categories' && (
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
               {categories.map(c => (
                 <div key={c.id} className="bg-white p-4 rounded-xl shadow-sm border flex justify-between items-center">
                   <span className="font-bold text-slate-700">{c.name}</span>
                   <div className="flex gap-1">
                      <button onClick={()=>{setModalType('category');setEditItem(c);setCatForm({name:c.name});setIsModalOpen(true)}} className="p-1 text-slate-400 hover:text-teal-600"><Edit2 className="w-4 h-4"/></button>
                      <button onClick={()=>deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'categories', c.id))} className="p-1 text-slate-400 hover:text-red-600"><Trash2 className="w-4 h-4"/></button>
                   </div>
                 </div>
               ))}
             </div>
          )}
        </div>
      </main>

      {/* MODALS */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between mb-4">
              <h3 className="text-xl font-bold">
                {modalType === 'session' && (editItem ? '編輯版次' : '新增版次')}
                {modalType === 'equipment' && (editItem ? '編輯設備' : '新增設備')}
                {modalType === 'category' && (editItem ? '編輯分類' : '新增分類')}
              </h3>
              <button onClick={()=>setIsModalOpen(false)}><X className="w-6 h-6 text-slate-400"/></button>
            </div>
            
            {/* Session Form with Copy Option */}
            {modalType === 'session' && (
              <form onSubmit={handleSaveSession} className="space-y-4">
                <div><label className="text-sm font-bold">版次/清單名稱</label><input className="w-full border rounded p-2" value={sessionForm.name} onChange={e=>setSessionForm({...sessionForm, name:e.target.value})} placeholder="例如: 114-1實驗室設備" required/></div>
                <div><label className="text-sm font-bold">日期</label><input type="date" className="w-full border rounded p-2" value={sessionForm.date} onChange={e=>setSessionForm({...sessionForm, date:e.target.value})} required/></div>
                
                {/* 🟢 [NEW] Copy Checkbox */}
                {!editItem && sessions.length > 0 && (
                  <div className="flex items-center gap-2 p-3 bg-teal-50 rounded border border-teal-100">
                    <input 
                      type="checkbox" 
                      id="copyFromPrevious" 
                      className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                      checked={sessionForm.copyFromPrevious}
                      onChange={e=>setSessionForm({...sessionForm, copyFromPrevious:e.target.checked})}
                    />
                    <label htmlFor="copyFromPrevious" className="text-sm text-teal-800 cursor-pointer select-none">
                      <span className="font-bold">複製上一個版次的設備資料?</span>
                      <br/><span className="text-xs text-teal-600">(將複製名稱、分類、總數，但借出數會歸零)</span>
                    </label>
                  </div>
                )}

                <button type="submit" className="w-full bg-teal-600 text-white py-2 rounded font-bold">儲存</button>
              </form>
            )}

            {/* Equipment Form */}
            {modalType === 'equipment' && (
              <form onSubmit={handleSaveEquipment} className="space-y-4">
                <div><label className="text-sm font-bold">名稱</label><input className="w-full border rounded p-2" value={equipForm.name} onChange={e=>setEquipForm({...equipForm, name:e.target.value})} required/></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="text-sm font-bold">數量</label><input type="number" className="w-full border rounded p-2" value={equipForm.quantity} onChange={e=>setEquipForm({...equipForm, quantity:e.target.value})} required/></div>
                  <div>
                    <label className="text-sm font-bold">分類</label>
                    <select className="w-full border rounded p-2" value={equipForm.categoryId} onChange={e=>setEquipForm({...equipForm, categoryId:e.target.value})} required>
                      <option value="" disabled>選擇分類</option>
                      {categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                </div>
                <div><label className="text-sm font-bold">備註</label><input className="w-full border rounded p-2" value={equipForm.note} onChange={e=>setEquipForm({...equipForm, note:e.target.value})}/></div>
                <button type="submit" className="w-full bg-teal-600 text-white py-2 rounded font-bold">儲存</button>
              </form>
            )}

             {/* Category Form */}
             {modalType === 'category' && (
              <form onSubmit={handleSaveCategory} className="space-y-4">
                <div><label className="text-sm font-bold">分類名稱</label><input className="w-full border rounded p-2" value={catForm.name} onChange={e=>setCatForm({...catForm, name:e.target.value})} required/></div>
                <button type="submit" className="w-full bg-teal-600 text-white py-2 rounded font-bold">儲存</button>
              </form>
            )}

            {/* Borrow Form */}
            {modalType === 'borrow' && (
              <form onSubmit={handleBorrow} className="space-y-4">
                <div className="bg-indigo-50 p-3 rounded text-sm text-indigo-800 font-bold mb-2">
                  <div className="flex justify-between">
                    <span>借用物品：{borrowForm.equipmentName}</span>
                    <span>可借：{borrowForm.maxQuantity}</span>
                  </div>
                </div>
                
                {/* [NEW] 借用數量輸入框 */}
                <div>
                  <label className="text-sm font-bold">借用數量</label>
                  <input 
                    type="number" 
                    min="1" 
                    max={borrowForm.maxQuantity}
                    className="w-full border rounded p-2" 
                    value={borrowForm.quantity} 
                    onChange={e=>setBorrowForm({...borrowForm, quantity:e.target.value})} 
                    required
                  />
                  <p className="text-xs text-gray-400 mt-1">最大可借數量：{borrowForm.maxQuantity}</p>
                </div>

                <div><label className="text-sm font-bold">借用日期</label><input type="date" className="w-full border rounded p-2" value={borrowForm.date} onChange={e=>setBorrowForm({...borrowForm, date:e.target.value})} required/></div>
                <div><label className="text-sm font-bold">借用人姓名</label><input className="w-full border rounded p-2" value={borrowForm.borrower} onChange={e=>setBorrowForm({...borrowForm, borrower:e.target.value})} required/></div>
                <div><label className="text-sm font-bold">聯絡電話</label><input type="tel" className="w-full border rounded p-2" value={borrowForm.phone} onChange={e=>setBorrowForm({...borrowForm, phone:e.target.value})} required/></div>
                <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded font-bold">確認借出</button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
