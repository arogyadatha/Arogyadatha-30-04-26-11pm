import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Pill, 
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
  ClipboardList,
  LogOut,
  Bell,
  Truck,
  ShoppingCart,
  ChevronRight
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
  collectionGroup
} from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function PharmacyDashboard({ user, onLogout }: { user: any, onLogout: () => void }) {
  const [orders, setOrders] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingQuotes: 0,
    processing: 0,
    deliveredToday: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!user.uid) return;

    const q = query(collectionGroup(db, 'pharmacyOrders'), where('pharmacyId', '==', user.uid));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setOrders(data);
      
      const today = new Date().toDateString();
      setStats({
        totalOrders: data.length,
        pendingQuotes: data.filter(r => r.status === 'requested').length,
        processing: data.filter(r => r.status === 'accepted' || r.status === 'packing' || r.status === 'out for delivery').length,
        deliveredToday: data.filter(r => {
          const updatedAtDate = r.updatedAt?.toDate?.() || (r.updatedAt instanceof Date ? r.updatedAt : null);
          return r.status === 'completed' && updatedAtDate?.toDateString() === today;
        }).length
      });
      setLoading(false);
    });

    return () => unsub();
  }, [user.uid]);

  const updateStatus = async (orderId: string, patientId: string, status: string) => {
    try {
      await updateDoc(doc(db, 'patients', patientId, 'pharmacyOrders', orderId), {
        status,
        updatedAt: serverTimestamp()
      });
      toast.success(`Status updated to ${status}`);
    } catch (e) {
      toast.error('Failed to update status');
    }
  };

  return (
    <div className="flex h-full bg-[#FFFBEB] overflow-hidden">
      {/* SIDEBAR */}
      <div className="w-72 h-full bg-white border-r border-amber-100 flex flex-col p-6 shrink-0">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-amber-600 rounded-xl flex items-center justify-center text-white shadow-lg">
            <Pill className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tighter uppercase">Pharma Portal</h2>
        </div>

        <nav className="space-y-2">
           {[
             { label: 'Overview', icon: Activity, active: true },
             { label: 'Inventory', icon: ShoppingCart },
             { label: 'Settings', icon: SettingsIcon },
           ].map((item, i) => (
             <button key={i} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${item.active ? 'bg-amber-600 text-white shadow-xl' : 'text-slate-400 hover:text-slate-900'}`}>
               <item.icon className="w-4 h-4" />
               {item.label}
             </button>
           ))}
        </nav>

        <div className="mt-auto">
           <Button 
             onClick={onLogout}
             variant="outline" 
             className="w-full rounded-2xl border-2 border-red-50 text-red-500 hover:bg-red-50 font-black"
           >
             <LogOut className="w-5 h-5 mr-2" /> Sign Out
           </Button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col p-8 overflow-y-auto no-scrollbar">
        <div className="flex justify-between items-center mb-10">
          <div>
             <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">Pharmacy Dashboard</h1>
             <p className="text-xs font-bold text-amber-600 uppercase tracking-[0.3em]">Supply Chain Live Feed</p>
          </div>
          <div className="flex items-center gap-4">
             <div className="relative">
                <Bell className="w-6 h-6 text-slate-400" />
                <div className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
             </div>
             <div className="flex items-center gap-3 pl-4 border-l border-amber-100">
                <div className="text-right">
                   <p className="text-xs font-black text-slate-900 leading-none">{user.fullName}</p>
                   <p className="text-[9px] font-bold text-amber-600 uppercase mt-0.5 tracking-wider">Licensed Pharmacy</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-600 flex items-center justify-center text-white font-black uppercase shadow-lg">
                   {user.fullName?.[0]}
                </div>
             </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {[
            { label: 'Total Orders', value: stats.totalOrders, icon: ShoppingCart, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Pending Quotes', value: stats.pendingQuotes, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
            { label: 'In processing', value: stats.processing, icon: Truck, color: 'text-orange-600', bg: 'bg-orange-50' },
            { label: 'Delivered Today', value: stats.deliveredToday, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          ].map((m, i) => (
            <Card key={i} className="border-none shadow-sm rounded-3xl overflow-hidden group hover:shadow-xl transition-all">
              <CardContent className="p-6">
                <div className={`w-10 h-10 ${m.bg} rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110`}>
                  <m.icon className={`w-5 h-5 ${m.color}`} />
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{m.label}</p>
                <h3 className="text-3xl font-black text-slate-900 mt-1">{m.value}</h3>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="flex-1 border-none shadow-sm rounded-[40px] overflow-hidden flex flex-col min-h-0 bg-white">
           <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                 <CardTitle className="text-2xl font-black text-slate-900 uppercase tracking-tight">Supply Requests</CardTitle>
                 <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Real-time Order Queue</p>
              </div>
              <div className="flex items-center gap-3">
                 <div className="relative w-72">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input 
                      placeholder="Search patient or order..." 
                      className="pl-11 h-12 rounded-2xl bg-slate-50 border-none font-bold text-sm"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                 </div>
                 <Button variant="outline" className="h-12 w-12 rounded-2xl border-slate-100 p-0 text-slate-400 hover:text-slate-900">
                    <Filter className="w-5 h-5" />
                 </Button>
              </div>
           </div>

           <div className="flex-1 overflow-y-auto no-scrollbar p-0">
              <table className="w-full text-left">
                 <thead className="sticky top-0 bg-white z-10">
                    <tr className="border-b border-slate-50">
                       <th className="py-6 px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Customer</th>
                       <th className="py-6 px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Medicines</th>
                       <th className="py-6 px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Delivery</th>
                       <th className="py-6 px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                       <th className="py-6 px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                    {loading ? (
                      <tr><td colSpan={5} className="py-20 text-center font-black text-slate-300 uppercase animate-pulse">Syncing inventory...</td></tr>
                    ) : orders.length === 0 ? (
                      <tr><td colSpan={5} className="py-20 text-center flex flex-col items-center">
                        <Pill className="w-12 h-12 text-slate-200 mb-4" />
                        <p className="font-black text-slate-300 uppercase tracking-widest text-xs">No pharmacy orders found.</p>
                      </td></tr>
                    ) : orders.map((order) => (
                      <tr key={order.id} className="group hover:bg-amber-50/30 transition-all">
                         <td className="py-5 px-8">
                            <p className="text-sm font-black text-slate-900">{order.patientName}</p>
                            <p className="text-[10px] font-bold text-amber-600 uppercase">#{order.pharmacyRequestId}</p>
                         </td>
                         <td className="py-5 px-8">
                            <div className="flex flex-wrap gap-1">
                               {order.medicines?.map((m: any, i: number) => (
                                 <span key={i} className="text-[9px] font-black bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md uppercase">{m.medicineName}</span>
                               ))}
                            </div>
                         </td>
                         <td className="py-5 px-8">
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                               <MapPin className="w-3 h-3 text-amber-500" />
                               {order.patientLocation?.address || 'View Details'}
                            </div>
                         </td>
                         <td className="py-5 px-8">
                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              order.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                            }`}>
                              {order.status}
                            </span>
                         </td>
                         <td className="py-5 px-8 text-right">
                            <div className="flex justify-end gap-2">
                               <Button onClick={() => updateStatus(order.id, order.patientId, 'out for delivery')} variant="outline" className="h-10 text-[10px] font-black uppercase px-4 rounded-xl border-slate-100">Dispatch</Button>
                               <Button onClick={() => updateStatus(order.id, order.patientId, 'completed')} className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-[10px] font-black uppercase px-4 h-10 shadow-lg shadow-amber-100">Delivered</Button>
                            </div>
                         </td>
                      </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </Card>
      </div>
    </div>
  );
}
