
"use client"

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ShieldCheck, 
  LogOut, 
  Loader2, 
  Lock,
  Settings,
  UserCheck
} from 'lucide-react';
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

  // Check for admin role - Path-based get is allowed for the owner
  const adminRoleRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, 'roles_admin', user.uid);
  }, [db, user]);

  const { data: adminRole, isLoading: isAdminRoleLoading } = useDoc(adminRoleRef);
  
  // Important: Explicitly verify admin data is present
  const isAdmin = !!adminRole;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setLocalAuthLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      setAuthError('Invalid credentials. Access restricted to verified administrators.');
    } finally {
      setLocalAuthLoading(false);
    }
  };

  const handleLogout = () => signOut(auth);

  if (isUserLoading || isAdminRoleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F8F8]">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  // If not logged in or not an admin, show unauthorized screen
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
                : "Secure supervisor access for pharmacy management"}
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
                  <p className="text-[10px] font-bold leading-relaxed opacity-80">UID: {user.uid}</p>
                </div>
                <Button onClick={handleLogout} variant="outline" className="w-full h-14 rounded-full font-black uppercase text-[10px] tracking-widest border-2">Logout</Button>
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
            <span className="text-[10px] font-black uppercase text-gray-400 bg-gray-50 px-4 py-2 rounded-full border">Verified Administrator</span>
            <Button variant="ghost" onClick={handleLogout} className="text-red-500 hover:text-red-600 rounded-full font-bold">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="rounded-[40px] border-none shadow-xl bg-white p-10 flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-primary/10 rounded-[32px] flex items-center justify-center mb-6">
              <UserCheck className="w-10 h-10 text-primary" />
            </div>
            <CardTitle className="text-2xl font-black mb-2">Welcome, Supervisor</CardTitle>
            <CardDescription className="max-w-xs mx-auto">
              Your identity has been verified. The administrative portal is currently being configured for real-time inventory and order management.
            </CardDescription>
            <Button className="mt-8 rounded-full h-12 px-10 font-bold uppercase text-[10px] tracking-widest">View System Health</Button>
          </Card>

          <Card className="rounded-[40px] border-none shadow-xl bg-white p-10 flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-gray-50 rounded-[32px] flex items-center justify-center mb-6">
              <Settings className="w-10 h-10 text-gray-400" />
            </div>
            <CardTitle className="text-2xl font-black mb-2">Platform Settings</CardTitle>
            <CardDescription className="max-w-xs mx-auto">
              Configure global app parameters, shipping logic, and administrative permissions.
            </CardDescription>
            <Button variant="outline" className="mt-8 rounded-full h-12 px-10 font-bold uppercase text-[10px] tracking-widest border-2">Manage Access</Button>
          </Card>
        </div>
      </main>
    </div>
  );
}
