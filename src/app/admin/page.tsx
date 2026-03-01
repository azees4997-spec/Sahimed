
"use client"

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, LogOut, Package, ClipboardList, Activity, Eye, Search, MapPin, Phone, Loader2, Lock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useUser, useFirestore, useDoc, useAuth, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';

export default function AdminDashboard() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const auth = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localAuthLoading, setLocalAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  // Check for admin role in the dedicated collection based on current UID
  const adminRoleRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, 'roles_admin', user.uid);
  }, [db, user]);

  const { data: adminRole, isLoading: isAdminRoleLoading } = useDoc(adminRoleRef);
  const isAdmin = !!adminRole;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setLocalAuthLoading(true);
    
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      setAuthError('Invalid credentials. If you are a new admin, please register your account first or check roles_admin.');
    } finally {
      setLocalAuthLoading(false);
    }
  };

  const handleLogout = () => {
    signOut(auth);
  };

  if (isUserLoading || isAdminRoleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F8F8]">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  // If not logged in or not an admin
  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F8F8] p-4">
        <Card className="max-w-md w-full rounded-[40px] shadow-2xl border-none">
          <CardHeader className="text-center p-12 bg-primary text-white rounded-t-[40px]">
            <div className="w-20 h-20 bg-white/10 rounded-[32px] flex items-center justify-center mx-auto mb-6 backdrop-blur">
              <ShieldCheck className="w-10 h-10 text-white" />
            </div>
            <CardTitle className="text-3xl font-bold font-headline">Pharmacist Portal</CardTitle>
            <CardDescription className="text-white/80">
              {user && !isAdmin 
                ? "Unauthorized Access detected." 
                : "Secure supervisor access for order fulfillment"}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-10">
            {!user ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <Input 
                  type="email" 
                  placeholder="Admin Email" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  className="h-14 rounded-2xl bg-gray-50 border-none font-bold" 
                  required 
                />
                <Input 
                  type="password" 
                  placeholder="Password" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  className="h-14 rounded-2xl bg-gray-50 border-none font-bold" 
                  required 
                />
                {authError && <p className="text-[10px] text-red-500 font-black uppercase text-center">{authError}</p>}
                <Button type="submit" disabled={localAuthLoading} className="w-full h-16 rounded-full font-black text-lg shadow-lg shadow-primary/20 uppercase tracking-widest">
                  {localAuthLoading ? <Loader2 className="animate-spin w-5 h-5 mx-auto" /> : "Login to Console"}
                </Button>
              </form>
            ) : (
              <div className="text-center space-y-6">
                <div className="p-8 bg-orange-50 text-orange-700 rounded-[32px] border border-orange-100 flex flex-col items-center gap-4">
                  <Lock className="w-10 h-10 mb-2 opacity-50" />
                  <p className="text-xs font-black uppercase tracking-widest">Role Not Authorized</p>
                  <p className="text-[10px] font-bold leading-relaxed opacity-80">
                    Your UID: <span className="text-primary font-black select-all">{user.uid}</span>
                  </p>
                  <p className="text-[9px] font-bold text-gray-500">
                    To access this panel, add a document with the above UID as the ID to the <code className="bg-gray-200 px-1 rounded text-gray-900">roles_admin</code> collection in your Firebase Console.
                  </p>
                </div>
                <Button onClick={handleLogout} variant="outline" className="w-full h-14 rounded-full font-black uppercase text-[10px] tracking-widest border-2">Logout & Try Again</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F8F8]">
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-primary p-1.5 rounded-lg">
              <div className="text-white font-bold text-xl tracking-tighter">HL</div>
            </div>
            <span className="font-bold text-xl font-headline tracking-tight">Supervisor Console</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:block text-right">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Administrator</p>
              <p className="text-sm font-bold text-gray-900">{user.email}</p>
            </div>
            <Button variant="ghost" onClick={handleLogout} className="gap-2 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-full font-bold h-10 px-6">
              <LogOut className="w-4 h-4" /> Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          {[
            { label: 'New Orders', val: '42', icon: Package, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Pending Reviews', val: '15', icon: ClipboardList, color: 'text-orange-600', bg: 'bg-orange-50' },
            { label: 'Live Revenue', val: '₹84,200', icon: Activity, color: 'text-green-600', bg: 'bg-green-50' },
            { label: 'Avg Delivery', val: '2.4 Days', icon: Eye, color: 'text-purple-600', bg: 'bg-purple-50' }
          ].map((stat, i) => (
            <Card key={i} className="rounded-[32px] border-none shadow-sm">
              <CardContent className="p-8 flex items-center gap-6">
                <div className={`w-14 h-14 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center`}>
                  <stat.icon className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
                  <p className="text-2xl font-black">{stat.val}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="rounded-[40px] border-none shadow-xl overflow-hidden bg-white">
          <CardHeader className="bg-white border-b p-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <CardTitle className="text-2xl font-black">Live Order Stream</CardTitle>
                <CardDescription className="font-medium">Manage verification, prescription checks & logistics</CardDescription>
              </div>
              <div className="relative w-full md:w-80">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input placeholder="Search Customer, Location..." className="pl-12 rounded-full h-12 bg-gray-50 border-none font-bold" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-gray-50/50">
                <TableRow className="border-none">
                  <TableHead className="pl-10 text-[10px] font-black uppercase tracking-widest text-gray-400">Order & Customer</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-gray-400">Location Details</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-gray-400">Prescription</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-gray-400">Amount</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-gray-400">Status</TableHead>
                  <TableHead className="pr-10 text-right text-[10px] font-black uppercase tracking-widest text-gray-400">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[
                  { id: 'ORD-9901', user: 'Rahul Khanna', phone: '+91 9988776655', loc: 'Worli, Mumbai', pres: 'Verified', amt: '₹1,450', status: 'Processing' },
                  { id: 'ORD-9902', user: 'Priya Sharma', phone: '+91 9123456780', loc: 'Whitefield, Bangalore', pres: 'Review Photo', amt: '₹2,840', status: 'Pending Review' },
                  { id: 'ORD-9903', user: 'Amit Gupta', phone: '+91 9812345678', loc: 'Gurugram, HR', pres: 'N/A', amt: '₹590', status: 'Dispatched' },
                  { id: 'ORD-9904', user: 'Sneha Reddy', phone: '+91 9441234567', loc: 'Hitech City, Hyderabad', pres: 'Review Photo', amt: '₹4,200', status: 'Pending Review' },
                ].map((order) => (
                  <TableRow key={order.id} className="hover:bg-gray-50/80 transition-all border-b border-gray-50 group">
                    <TableCell className="pl-10 py-6">
                       <div className="flex flex-col">
                          <span className="font-black text-gray-900 mb-1 group-hover:text-primary transition-colors">{order.id}</span>
                          <span className="text-sm font-bold text-gray-500">{order.user}</span>
                          <span className="text-[10px] text-gray-400 flex items-center gap-1"><Phone className="w-3 h-3" /> {order.phone}</span>
                       </div>
                    </TableCell>
                    <TableCell>
                       <div className="flex items-center gap-2 text-sm font-bold text-gray-600">
                          <MapPin className="w-4 h-4 text-primary" />
                          {order.loc}
                       </div>
                    </TableCell>
                    <TableCell>
                      {order.pres !== 'N/A' ? (
                        <Badge variant="outline" className={`rounded-lg px-3 py-1 text-[10px] font-black uppercase border-2 ${order.pres === 'Verified' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-orange-50 text-orange-700 border-orange-100 animate-pulse'}`}>
                          {order.pres}
                        </Badge>
                      ) : (
                        <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">No Pres.</span>
                      )}
                    </TableCell>
                    <TableCell className="font-black text-gray-900">{order.amt}</TableCell>
                    <TableCell>
                       <Badge className={`rounded-lg px-4 py-2 text-[10px] font-black uppercase border-none shadow-sm ${
                         order.status === 'Pending Review' ? 'bg-orange-500 text-white' :
                         order.status === 'Processing' ? 'bg-blue-500 text-white' :
                         'bg-gray-100 text-gray-500'
                       }`}>
                         {order.status}
                       </Badge>
                    </TableCell>
                    <TableCell className="pr-10 text-right">
                      <Button variant="ghost" className="h-10 px-8 rounded-full font-black text-[10px] uppercase tracking-widest text-primary hover:bg-primary hover:text-white transition-all border-2 border-primary/10">
                        Review Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
