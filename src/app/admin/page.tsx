
"use client"

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, LogOut, Package, ClipboardList, Activity, Eye, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function AdminDashboard() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (user === 'supervisor' && pass === 'admin123') {
      setIsLoggedIn(true);
    } else {
      alert('Invalid Credentials');
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F8F8] p-4">
        <Card className="max-w-md w-full rounded-3xl shadow-2xl border-none">
          <CardHeader className="text-center p-12 bg-primary text-white rounded-t-3xl">
            <div className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center mx-auto mb-6 backdrop-blur">
              <ShieldCheck className="w-10 h-10 text-white" />
            </div>
            <CardTitle className="text-3xl font-bold font-headline">Pharmacist Access</CardTitle>
            <CardDescription className="text-white/80">Secure supervisor portal for order management</CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleLogin} className="space-y-4">
              <Input placeholder="Username (supervisor)" value={user} onChange={e => setUser(e.target.value)} className="h-12 rounded-xl" />
              <Input type="password" placeholder="Password (admin123)" value={pass} onChange={e => setPass(e.target.value)} className="h-12 rounded-xl" />
              <Button type="submit" className="w-full h-14 rounded-full font-bold text-lg">Login to Console</Button>
            </form>
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
            <span className="font-bold text-xl font-headline">Admin Console</span>
          </div>
          <Button variant="ghost" onClick={() => setIsLoggedIn(false)} className="gap-2 text-red-500 hover:text-red-600 hover:bg-red-50">
            <LogOut className="w-4 h-4" /> Logout
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="rounded-2xl border-none shadow-sm">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 text-primary rounded-xl flex items-center justify-center">
                <Package className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase">New Orders</p>
                <p className="text-2xl font-black">24</p>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-none shadow-sm">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-50 text-accent rounded-xl flex items-center justify-center">
                <ClipboardList className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase">Prescriptions</p>
                <p className="text-2xl font-black">12</p>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-none shadow-sm">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase">Revenue</p>
                <p className="text-2xl font-black">₹42,500</p>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-none shadow-sm">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
                <Eye className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase">Visitors</p>
                <p className="text-2xl font-black">1.2k</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="rounded-3xl border-none shadow-sm overflow-hidden">
          <CardHeader className="bg-white border-b p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-2xl font-bold">Pending Orders & Reviews</CardTitle>
                <CardDescription>Manage incoming orders and pharmacist verification</CardDescription>
              </div>
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input placeholder="Search orders..." className="pl-10 rounded-full" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="pl-8">Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Prescription</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="pr-8 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[
                  { id: 'ORD-9821', user: 'John Doe', pres: 'Yes', amt: '₹1,240', status: 'Pending Review' },
                  { id: 'ORD-9822', user: 'Sarah Smith', pres: 'No', amt: '₹599', status: 'Processing' },
                  { id: 'ORD-9823', user: 'Mike Ross', pres: 'Yes', amt: '₹3,450', status: 'Verified' },
                  { id: 'ORD-9824', user: 'Rachel Green', pres: 'No', amt: '₹249', status: 'Dispatched' },
                ].map((order) => (
                  <TableRow key={order.id} className="hover:bg-gray-50 transition-colors">
                    <TableCell className="pl-8 font-bold">{order.id}</TableCell>
                    <TableCell>{order.user}</TableCell>
                    <TableCell>
                      {order.pres === 'Yes' ? (
                        <Badge variant="outline" className="text-primary border-primary bg-blue-50">Review Photo</Badge>
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </TableCell>
                    <TableCell className="font-bold">{order.amt}</TableCell>
                    <TableCell>
                       <Badge className={
                         order.status === 'Pending Review' ? 'bg-orange-100 text-orange-700' :
                         order.status === 'Processing' ? 'bg-blue-100 text-blue-700' :
                         order.status === 'Verified' ? 'bg-green-100 text-green-700' :
                         'bg-gray-100 text-gray-700'
                       }>
                         {order.status}
                       </Badge>
                    </TableCell>
                    <TableCell className="pr-8 text-right">
                      <Button variant="ghost" size="sm" className="font-bold text-primary">Details</Button>
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
