import React, { useState, useEffect } from 'react';
import { 
  Users, 
  FlaskConical, 
  Activity, 
  TrendingUp, 
  Search,
  Clock,
  MoreVertical,
  Filter,
  Download,
  Settings as SettingsIcon,
  Video,
  MapPin,
  CheckCircle2,
  X,
  Plus,
  ArrowUpRight,
  ShieldCheck,
  Microscope,
  FileText,
  ChevronRight,
  ClipboardList,
  LogOut,
  Bell,
  Trash2,
  Upload,
  Building2,
  Phone,
  Mail,
  Camera
} from 'lucide-react';
import { db } from '../../lib/firebase';
import { 
  collection, 
  onSnapshot,
  query,
  where,
  doc,
  updateDoc,
  serverTimestamp,
  getDocs,
  addDoc,
  deleteDoc,
  collectionGroup
} from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

export default function LabDashboard({ user, onLogout }: { user: any, onLogout: () => void }) {
  const [activeTab, setActiveTab] = useState<'overview' | 'tests' | 'settings'>('overview');
  const [requests, setRequests] = useState<any[]>([]);
  const [tests, setTests] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalRequests: 0,
    pendingCollection: 0,
    processing: 0,
    completedToday: 0
  });
  const [isAvailable, setIsAvailable] = useState(user.isAvailable !== false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddTest, setShowAddTest] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [newTest, setNewTest] = useState({ testName: '', category: 'Blood Test', price: '', description: '' });
  const [editingPrice, setEditingPrice] = useState<{id: string, price: string} | null>(null);

  // Profile Settings State
  const [profile, setProfile] = useState({
    labName: user.labName || user.fullName || '',
    city: user.city || '',
    address: user.address || '',
    phoneNumber: user.phoneNumber || '',
    email: user.email || ''
  });

  useEffect(() => {
    if (!user.uid) return;

    const q = query(collectionGroup(db, 'labRequests'), where('labId', '==', user.uid));
    const unsubRequests = onSnapshot(q, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRequests(data);
      
      const today = new Date().toDateString();
      setStats({
        totalRequests: data.length,
        pendingCollection: data.filter(r => r.status === 'requested' || r.status === 'accepted').length,
        processing: data.filter(r => r.status === 'collected' || r.status === 'processing').length,
        completedToday: data.filter(r => {
          const updatedAtDate = r.updatedAt?.toDate?.() || (r.updatedAt instanceof Date ? r.updatedAt : null);
          return r.status === 'completed' && updatedAtDate?.toDateString() === today;
        }).length
      });
      setLoading(false);
    });

    const unsubTests = onSnapshot(collection(db, 'labs', user.uid, 'tests'), (snap) => {
      setTests(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubRequests();
      unsubTests();
    };
  }, [user.uid]);

  const toggleAvailability = async () => {
    const newVal = !isAvailable;
    setIsAvailable(newVal);
    await updateDoc(doc(db, 'users', user.uid), { isAvailable: newVal });
    toast.custom((t) => (
      <div className={`p-4 rounded-2xl flex items-center gap-3 border-2 ${newVal ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-slate-50 border-slate-200 text-slate-800 shadow-2xl'}`}>
        <div className={`w-3 h-3 rounded-full ${newVal ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
        <p className="font-black uppercase tracking-widest text-[10px]">
          {newVal ? 'Lab is now LIVE & Visible' : 'Lab is now OFFLINE'}
        </p>
      </div>
    ));
  };

  const updateProfile = async () => {
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        ...profile,
        updatedAt: serverTimestamp()
      });
      toast.success('Lab profile updated successfully');
    } catch (e) {
      toast.error('Failed to update profile');
    }
  };

  const addTest = async () => {
    if (!newTest.testName || !newTest.price) return;
    await addDoc(collection(db, 'labs', user.uid, 'tests'), {
      ...newTest,
      price: Number(newTest.price),
      createdAt: serverTimestamp()
    });
    setNewTest({ testName: '', category: 'Blood Test', price: '', description: '' });
    setShowAddTest(false);
    toast.success('Test added to directory');
  };

  const deleteTest = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'labs', user.uid, 'tests', id));
      toast.success('Test removed');
    } catch (e) {
      toast.error('Failed to remove test');
    }
  };

  const updatePrice = async (id: string) => {
    if (!editingPrice || !editingPrice.price) return;
    await updateDoc(doc(db, 'labs', user.uid, 'tests', id), {
      price: Number(editingPrice.price)
    });
    setEditingPrice(null);
    toast.success('Price updated in real-time');
  };

  const downloadTemplate = () => {
    const template = [
      { 'Test Name': 'Complete Blood Count', 'Category': 'Blood Test', 'Price': 500, 'Description': 'Routine CBC test' },
      { 'Test Name': 'Sugar Fasting', 'Category': 'Blood Test', 'Price': 150, 'Description': 'FBS test' }
    ];
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "TestsTemplate");
    XLSX.writeFile(wb, "Lab_Tests_Template.xlsx");
  };

  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const bstr = event.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        // Validation
        const isValid = data.every((item: any) => 
          item['Test Name'] && item['Price'] && item['Category']
        );

        if (!isValid) {
          toast.error('Invalid Template Format! Use the provided template.');
          return;
        }

        toast.info(`Processing ${data.length} tests...`);
        
        for (const item of data as any[]) {
          await addDoc(collection(db, 'labs', user.uid, 'tests'), {
            testName: item['Test Name'],
            category: item['Category'],
            price: Number(item['Price']),
            description: item['Description'] || '',
            createdAt: serverTimestamp()
          });
        }

        toast.success('Bulk upload complete!');
        setShowBulkModal(false);
      } catch (err) {
        toast.error('Error parsing file');
      }
    };
    reader.readAsBinaryString(file);
  };

  const updateStatus = async (requestId: string, patientId: string, status: string) => {
    try {
      await updateDoc(doc(db, 'patients', patientId, 'labRequests', requestId), {
        status,
        updatedAt: serverTimestamp()
      });
      toast.success(`WORKFLOW: ${status.toUpperCase()}`);
    } catch (e) {
      toast.error('Sync failed');
    }
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden font-sans text-slate-900">
      {/* SIDEBAR */}
      <div className="w-80 h-full bg-white border-r border-slate-100 flex flex-col p-8 shrink-0 relative z-20">
        <div className="flex items-center gap-4 mb-16">
          <div className="w-14 h-14 bg-slate-900 rounded-[24px] flex items-center justify-center text-white shadow-2xl shadow-slate-200 ring-4 ring-emerald-500/10">
            <FlaskConical className="w-7 h-7 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase leading-none">Arogyadatha</h2>
            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mt-2">Diagnostic Command</p>
          </div>
        </div>

        <nav className="space-y-4">
           {[
             { id: 'overview', label: 'Dashboard Feed', icon: Activity },
             { id: 'tests', label: 'Directory Manager', icon: ClipboardList },
             { id: 'settings', label: 'Lab Profile', icon: SettingsIcon },
           ].map((item) => (
             <button 
               key={item.id} 
               onClick={() => setActiveTab(item.id as any)}
               className={`w-full flex items-center gap-5 px-6 py-5 rounded-[24px] font-black text-[11px] uppercase tracking-widest transition-all group ${activeTab === item.id ? 'bg-slate-900 text-white shadow-[0_20px_50px_rgba(0,0,0,0.2)]' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'}`}
             >
               <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'text-emerald-400' : 'text-slate-300 group-hover:text-slate-500'}`} />
               {item.label}
             </button>
           ))}
        </nav>

        <div className="mt-auto space-y-8">
           <div className={`p-8 rounded-[32px] border-4 transition-all duration-500 ${isAvailable ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex justify-between items-center mb-5">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Visibility</p>
                 <div className={`w-3 h-3 rounded-full ${isAvailable ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
              </div>
              <p className={`text-xl font-black uppercase tracking-tighter mb-4 ${isAvailable ? 'text-emerald-700' : 'text-slate-400'}`}>
                {isAvailable ? 'System Live' : 'System Offline'}
              </p>
              <button 
                onClick={toggleAvailability}
                className={`w-full py-4 rounded-[18px] font-black text-[10px] uppercase tracking-widest transition-all shadow-xl ${isAvailable ? 'bg-emerald-600 text-white shadow-emerald-200' : 'bg-slate-900 text-white shadow-slate-200'}`}
              >
                {isAvailable ? 'Switch to Offline' : 'Activate Live Mode'}
              </button>
           </div>
           
           <div className="flex gap-4">
              <Button variant="outline" className="flex-1 rounded-[20px] border-slate-100 text-slate-400 hover:bg-slate-50 h-14">
                <Bell className="w-5 h-5" />
              </Button>
              <Button 
                onClick={onLogout}
                variant="outline" 
                className="flex-1 rounded-[20px] border-red-50 text-red-500 hover:bg-red-50 font-black h-14"
              >
                <LogOut className="w-5 h-5" />
              </Button>
           </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col p-12 overflow-y-auto no-scrollbar relative bg-[#F8FAFC]">
        {/* HEADER */}
        <div className="flex justify-between items-center mb-16">
          <div>
             <div className="flex items-center gap-3 mb-4">
                <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-[9px] font-black uppercase tracking-[0.3em]">Operational</span>
                <span className="w-1 h-1 bg-slate-200 rounded-full" />
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">v4.0 Edge Console</span>
             </div>
             <h1 className="text-6xl font-black text-slate-900 tracking-tighter uppercase leading-none">{activeTab}</h1>
          </div>
          <div className="flex items-center gap-8">
             <div className="text-right">
                <p className="text-lg font-black text-slate-900 uppercase leading-none mb-2">{user.labName || user.fullName}</p>
                <div className="flex items-center justify-end gap-2">
                   <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Certified Administrator</p>
                </div>
             </div>
             <div className="w-20 h-20 rounded-[28px] bg-white border-4 border-slate-50 shadow-2xl flex items-center justify-center text-2xl font-black text-slate-900">
                {user.fullName?.[0]}
             </div>
          </div>
        </div>

        {activeTab === 'overview' && (
          <div className="space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { label: 'Total Intake', value: stats.totalRequests, icon: ClipboardList, color: 'text-indigo-600', bg: 'bg-indigo-50/50', border: 'border-indigo-100' },
                { label: 'Awaiting Collection', value: stats.pendingCollection, icon: MapPin, color: 'text-amber-600', bg: 'bg-amber-50/50', border: 'border-amber-100' },
                { label: 'In Lab processing', value: stats.processing, icon: Microscope, color: 'text-teal-600', bg: 'bg-teal-50/50', border: 'border-teal-100' },
                { label: 'Reports Released', value: stats.completedToday, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50/50', border: 'border-emerald-100' },
              ].map((m, i) => (
                <Card key={i} className={`border-2 ${m.border} shadow-none rounded-[40px] overflow-hidden group hover:shadow-2xl hover:scale-[1.02] transition-all duration-500 bg-white/60 backdrop-blur-sm p-10`}>
                  <div className={`w-16 h-16 ${m.bg} rounded-[24px] flex items-center justify-center mb-8 shadow-inner transition-transform group-hover:rotate-12`}>
                    <m.icon className={`w-8 h-8 ${m.color}`} />
                  </div>
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">{m.label}</p>
                  <h3 className="text-5xl font-black text-slate-900 mt-3 tracking-tighter leading-none">{m.value}</h3>
                </Card>
              ))}
            </div>

            <Card className="border-none shadow-[0_30px_100px_rgba(0,0,0,0.05)] rounded-[56px] overflow-hidden flex flex-col bg-white ring-1 ring-slate-100 p-2">
               <div className="p-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
                  <div>
                     <CardTitle className="text-4xl font-black text-slate-900 uppercase tracking-tighter mb-2">Operation Queue</CardTitle>
                     <p className="text-[11px] font-black text-emerald-500 uppercase tracking-[0.3em] flex items-center gap-2">
                       <Activity className="w-4 h-4" /> Live Patient Stream
                     </p>
                  </div>
                  <div className="flex items-center gap-6 w-full lg:w-auto">
                     <div className="relative flex-1 lg:w-96">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                        <Input 
                          placeholder="SCAN PATIENT ID..." 
                          className="pl-14 h-16 rounded-[24px] bg-slate-50 border-none font-black text-[11px] uppercase tracking-widest focus:ring-4 focus:ring-emerald-500/10 transition-all text-slate-900 placeholder:text-slate-300"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                     </div>
                  </div>
               </div>

               <div className="overflow-y-auto no-scrollbar min-h-[500px] px-6 pb-6">
                  <table className="w-full text-left">
                     <thead>
                        <tr className="border-b border-slate-50">
                           <th className="py-8 px-8 text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Subject Entity</th>
                           <th className="py-8 px-8 text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Clinical Order</th>
                           <th className="py-8 px-8 text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Operational Status</th>
                           <th className="py-8 px-8 text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] text-right">Protocol Action</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-50">
                        {loading ? (
                          <tr><td colSpan={4} className="py-32 text-center animate-pulse font-black text-slate-200 uppercase tracking-widest">Transmitting Database...</td></tr>
                        ) : requests.length === 0 ? (
                          <tr><td colSpan={4} className="py-48 text-center text-slate-300 font-black uppercase text-sm tracking-[0.4em]">Queue Empty - Ready for Intake</td></tr>
                        ) : requests.filter(r => r.patientName?.toLowerCase().includes(searchQuery.toLowerCase()) || r.labRequestId?.toLowerCase().includes(searchQuery.toLowerCase())).map((req) => (
                          <tr key={req.id} className="group hover:bg-slate-50/80 transition-all duration-300 rounded-[32px]">
                             <td className="py-8 px-8">
                                <div className="flex items-center gap-6">
                                   <div className="w-14 h-14 rounded-[20px] bg-slate-900 flex items-center justify-center font-black text-white shadow-xl shadow-slate-200">
                                      {req.patientName?.[0]}
                                   </div>
                                   <div>
                                      <p className="text-lg font-black text-slate-900 uppercase tracking-tight">{req.patientName}</p>
                                      <p className="text-[10px] font-black text-emerald-500 mt-1 uppercase tracking-widest">ORD: #{req.labRequestId?.slice(-8)}</p>
                                   </div>
                                </div>
                             </td>
                             <td className="py-8 px-8">
                                <div className="flex flex-wrap gap-2">
                                   {req.tests?.map((t: any, i: number) => (
                                     <span key={i} className="text-[9px] font-black bg-white border-2 border-slate-100 text-slate-600 px-3 py-1.5 rounded-xl uppercase shadow-sm">{t.testName}</span>
                                   ))}
                                </div>
                             </td>
                             <td className="py-8 px-8">
                                <div className="flex items-center gap-3">
                                   <div className={`w-2 h-2 rounded-full ${req.status === 'completed' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                                   <span className={`px-4 py-2 rounded-2xl text-[9px] font-black uppercase tracking-[0.15em] border-2 ${
                                     req.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                                   }`}>
                                     {req.status}
                                   </span>
                                </div>
                             </td>
                             <td className="py-8 px-8 text-right">
                                <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all">
                                    <Button onClick={() => updateStatus(req.id, req.patientId, 'collected')} className="h-12 px-6 rounded-2xl bg-white border-2 border-slate-100 text-slate-900 font-black text-[9px] uppercase hover:bg-slate-900 hover:text-white transition-all">Mark Collection</Button>
                                    <Button onClick={() => updateStatus(req.id, req.patientId, 'completed')} className="h-12 px-8 rounded-2xl bg-slate-900 text-white font-black text-[9px] uppercase shadow-2xl active:scale-95 transition-all">Finalize Report</Button>
                                </div>
                             </td>
                          </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </Card>
          </div>
        )}

        {activeTab === 'tests' && (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
             <div className="flex justify-between items-end">
                <div>
                   <h2 className="text-5xl font-black text-slate-900 uppercase tracking-tighter">Diagnostic Directory</h2>
                   <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mt-3">Advanced Clinical Test Inventory Management</p>
                </div>
                <div className="flex gap-4">
                   <Button onClick={() => setShowBulkModal(true)} variant="outline" className="h-16 px-8 rounded-[24px] border-slate-100 text-slate-900 font-black uppercase text-[10px] tracking-widest flex items-center gap-3 hover:bg-slate-50">
                      <Upload className="w-5 h-5 text-emerald-500" /> Bulk Import
                   </Button>
                   <Button onClick={() => setShowAddTest(true)} className="h-16 px-10 bg-slate-900 text-white rounded-[24px] font-black uppercase text-[10px] tracking-widest shadow-2xl flex items-center gap-3 active:scale-95 transition-all">
                      <Plus className="w-5 h-5 text-emerald-400" /> Register Test
                   </Button>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {tests.map((test) => (
                   <Card key={test.id} className="border-none shadow-[0_20px_60px_rgba(0,0,0,0.04)] rounded-[48px] overflow-hidden bg-white p-10 group hover:shadow-2xl transition-all relative border-4 border-transparent hover:border-emerald-50">
                      <div className="flex justify-between items-start mb-10">
                         <div className="w-16 h-16 bg-slate-50 rounded-[28px] flex items-center justify-center text-slate-900 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                            <Microscope className="w-8 h-8" />
                         </div>
                         <div className="text-right">
                            {editingPrice?.id === test.id ? (
                              <div className="flex items-center gap-2">
                                <Input 
                                  className="w-24 h-10 rounded-xl bg-slate-50 border-2 border-emerald-500 text-lg font-black text-right text-slate-900"
                                  value={editingPrice.price}
                                  onChange={(e) => setEditingPrice({...editingPrice, price: e.target.value})}
                                  autoFocus
                                />
                                <Button size="sm" className="h-10 w-10 p-0 rounded-xl bg-emerald-600" onClick={() => updatePrice(test.id)}><CheckCircle2 className="w-5 h-5 text-white"/></Button>
                              </div>
                            ) : (
                              <div className="cursor-pointer group/price" onClick={() => setEditingPrice({id: test.id, price: test.price.toString()})}>
                                <p className="text-3xl font-black text-slate-900 tracking-tighter leading-none">₹{test.price}</p>
                                <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mt-2 group-hover/price:underline">Update Price</p>
                              </div>
                            )}
                         </div>
                      </div>
                      <h4 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-3 group-hover:text-emerald-600 transition-colors">{test.testName}</h4>
                      <div className="flex items-center gap-3 mb-6">
                         <span className="px-4 py-1.5 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-200">{test.category}</span>
                         <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-2"><Clock className="w-3 h-3" /> Real-time Sync</span>
                      </div>
                      <p className="text-xs font-bold text-slate-400 leading-relaxed mb-10 line-clamp-2">{test.description || 'Verified diagnostic parameters ensuring 99.9% clinical accuracy.'}</p>
                      
                      <div className="flex gap-4 opacity-0 group-hover:opacity-100 transition-all translate-y-4 group-hover:translate-y-0">
                         <Button variant="outline" className="flex-1 h-14 rounded-2xl border-slate-100 font-black text-[10px] uppercase tracking-widest text-slate-900">Configure</Button>
                         <Button onClick={() => deleteTest(test.id)} variant="outline" className="h-14 w-14 rounded-2xl border-red-50 text-red-400 hover:text-white hover:bg-red-500 hover:border-red-500 transition-all"><Trash2 className="w-5 h-5" /></Button>
                      </div>
                   </Card>
                ))}
             </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="max-w-4xl space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
             <div className="flex justify-between items-end">
                <div>
                   <h2 className="text-5xl font-black text-slate-900 uppercase tracking-tighter">Lab Settings</h2>
                   <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mt-3">Manage your diagnostic center profile & location</p>
                </div>
                <Button onClick={updateProfile} className="h-16 px-10 bg-slate-900 text-white rounded-[24px] font-black uppercase text-[10px] tracking-widest shadow-2xl active:scale-95 transition-all">Save Profile Changes</Button>
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="border-none shadow-xl rounded-[48px] bg-white p-10 space-y-8">
                   <div className="flex items-center gap-6 mb-4">
                      <div className="w-16 h-16 bg-emerald-50 rounded-[24px] flex items-center justify-center text-emerald-600">
                         <Building2 className="w-8 h-8" />
                      </div>
                      <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Center Identity</h3>
                   </div>
                   
                   <div className="space-y-6">
                      <div className="space-y-2">
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-4">Laboratory Name</p>
                         <Input className="h-16 rounded-[24px] bg-slate-50 border-none font-black text-sm uppercase tracking-wider pl-6 text-slate-900" value={profile.labName} onChange={e => setProfile({...profile, labName: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-4">Primary Contact Number</p>
                         <Input className="h-16 rounded-[24px] bg-slate-50 border-none font-black text-sm pl-6 text-slate-900" value={profile.phoneNumber} onChange={e => setProfile({...profile, phoneNumber: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-4">Email Address</p>
                         <Input className="h-16 rounded-[24px] bg-slate-50 border-none font-black text-sm pl-6 text-slate-900" value={profile.email} readOnly />
                      </div>
                   </div>
                </Card>

                <Card className="border-none shadow-xl rounded-[48px] bg-white p-10 space-y-8">
                   <div className="flex items-center gap-6 mb-4">
                      <div className="w-16 h-16 bg-indigo-50 rounded-[24px] flex items-center justify-center text-indigo-600">
                         <MapPin className="w-8 h-8" />
                      </div>
                      <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Geographical Data</h3>
                   </div>
                   
                   <div className="space-y-6">
                      <div className="space-y-2">
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-4">Operating City</p>
                         <Input className="h-16 rounded-[24px] bg-slate-50 border-none font-black text-sm uppercase tracking-wider pl-6 text-slate-900" placeholder="E.G. HYDERABAD" value={profile.city} onChange={e => setProfile({...profile, city: e.target.value.toUpperCase()})} />
                      </div>
                      <div className="space-y-2">
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-4">Full Operational Address</p>
                         <textarea className="w-full h-32 rounded-[24px] bg-slate-50 border-none font-bold text-sm p-6 outline-none resize-none text-slate-900" placeholder="Enter complete laboratory address..." value={profile.address} onChange={e => setProfile({...profile, address: e.target.value})} />
                      </div>
                   </div>
                </Card>
             </div>
          </div>
        )}

        {/* BULK UPLOAD MODAL */}
        <AnimatePresence>
           {showBulkModal && (
             <div className="fixed inset-0 z-[100] flex items-center justify-center p-8">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowBulkModal(false)} className="absolute inset-0 bg-slate-900/80 backdrop-blur-xl" />
                <motion.div initial={{ opacity: 0, scale: 0.9, y: 40 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 40 }} className="relative w-full max-w-2xl bg-white rounded-[56px] shadow-2xl overflow-hidden p-12">
                   <div className="flex justify-between items-center mb-12">
                      <div>
                         <h3 className="text-4xl font-black text-slate-900 uppercase tracking-tighter leading-none">Bulk Import Engine</h3>
                         <p className="text-[11px] font-black text-emerald-500 uppercase tracking-widest mt-4">Automated Inventory Synchronization</p>
                      </div>
                      <button onClick={() => setShowBulkModal(false)} className="w-14 h-14 rounded-[24px] bg-slate-50 flex items-center justify-center text-slate-400 hover:text-red-500 transition-all"><X className="w-6 h-6"/></button>
                   </div>

                   <div className="space-y-10">
                      <div className="p-10 border-4 border-dashed border-slate-100 rounded-[40px] bg-slate-50/50 flex flex-col items-center text-center group hover:border-emerald-500/20 hover:bg-emerald-50/10 transition-all cursor-pointer relative overflow-hidden">
                         <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl -mr-16 -mt-16" />
                         <div className="w-20 h-20 bg-white rounded-[28px] shadow-2xl flex items-center justify-center mb-8 text-slate-900 group-hover:scale-110 transition-transform">
                            <Upload className="w-10 h-10 text-emerald-500" />
                         </div>
                         <h4 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-3">Upload Test Spreadsheet</h4>
                         <p className="text-xs font-bold text-slate-400 mb-8 max-w-sm">Drop your .xlsx or .csv directory file here. System validates structure against official template.</p>
                         <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept=".xlsx, .xls, .csv" onChange={handleBulkUpload} />
                         <Button variant="outline" className="h-12 px-8 rounded-xl border-slate-100 text-[10px] font-black uppercase tracking-widest bg-white shadow-lg pointer-events-none text-slate-900">Select File</Button>
                      </div>

                      <div className="bg-slate-900 rounded-[32px] p-8 flex items-center justify-between shadow-2xl">
                         <div className="flex items-center gap-5">
                            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-emerald-400">
                               <Download className="w-6 h-6" />
                            </div>
                            <div>
                               <p className="text-white font-black uppercase text-xs tracking-widest leading-none mb-1">Official Template</p>
                               <p className="text-slate-400 font-bold text-[10px]">Use this format to avoid sync errors</p>
                            </div>
                         </div>
                         <Button onClick={downloadTemplate} className="h-12 px-6 bg-emerald-600 text-white rounded-xl font-black text-[10px] uppercase shadow-lg shadow-emerald-500/20 active:scale-95 transition-all">Download Now</Button>
                      </div>
                   </div>
                </motion.div>
             </div>
           )}
        </AnimatePresence>

        {/* ADD TEST MODAL (Individual) */}
        <AnimatePresence>
           {showAddTest && (
             <div className="fixed inset-0 z-[100] flex items-center justify-center p-8">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAddTest(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
                <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative w-full max-w-xl bg-white rounded-[48px] shadow-[0_40px_100px_rgba(0,0,0,0.4)] overflow-hidden p-10 text-slate-900">
                   <div className="flex justify-between items-center mb-10">
                      <div>
                         <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Register Test</h3>
                         <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mt-1">Expansion of diagnostic capabilities</p>
                      </div>
                      <button onClick={() => setShowAddTest(false)} className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-red-500 transition-all"><X /></button>
                   </div>

                   <div className="space-y-6">
                      <div className="space-y-2">
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-4">Test Name</p>
                         <Input className="h-16 rounded-[24px] bg-slate-50 border-none font-black text-sm uppercase tracking-wider pl-6 text-slate-900" placeholder="E.G. COMPLETE BLOOD COUNT" value={newTest.testName} onChange={e => setNewTest({...newTest, testName: e.target.value})} />
                      </div>
                      <div className="grid grid-cols-2 gap-6">
                         <div className="space-y-2">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-4">Category</p>
                            <select className="w-full h-16 rounded-[24px] bg-slate-50 border-none font-black text-xs uppercase tracking-wider pl-6 outline-none text-slate-900" value={newTest.category} onChange={e => setNewTest({...newTest, category: e.target.value})}>
                               <option>Blood Test</option>
                               <option>X-Ray / Scan</option>
                               <option>Urine Analysis</option>
                               <option>Clinical Bio</option>
                            </select>
                         </div>
                         <div className="space-y-2">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-4">Price (₹)</p>
                            <Input className="h-16 rounded-[24px] bg-slate-50 border-none font-black text-sm pl-6 text-slate-900" type="number" placeholder="500" value={newTest.price} onChange={e => setNewTest({...newTest, price: e.target.value})} />
                         </div>
                      </div>
                      <div className="space-y-2">
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-4">Description</p>
                         <textarea className="w-full h-32 rounded-[24px] bg-slate-50 border-none font-bold text-sm p-6 outline-none resize-none text-slate-900" placeholder="Enter clinical parameters and instructions..." value={newTest.description} onChange={e => setNewTest({...newTest, description: e.target.value})} />
                      </div>
                      <Button onClick={addTest} className="w-full h-16 bg-slate-900 text-white rounded-[24px] font-black uppercase text-[10px] tracking-widest shadow-xl shadow-slate-200 mt-4 active:scale-95 transition-all">Submit to Directory</Button>
                   </div>
                </motion.div>
             </div>
           )}
        </AnimatePresence>
      </div>
    </div>
  );
}
