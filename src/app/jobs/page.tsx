"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Trash2, Edit, ExternalLink, Calendar, User, MapPin, Loader2, ArrowLeft, Lock, Unlock } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Job } from '@/lib/types';

export default function JobsHistory() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const [isAdmin, setIsAdmin] = useState(false);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/jobs');
      const { data } = await response.json();
      setJobs(data || []);
    } catch (error) {
      console.error("Failed to fetch jobs", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    // Check admin role from the server on mount
    fetch('/api/auth/role')
      .then((r) => r.json())
      .then((d) => { if (d.role === 'admin') setIsAdmin(true); })
      .catch(() => {});
  }, []);

  const handleAdminToggle = async () => {
    try {
      const res = await fetch('/api/auth/role');
      const d = await res.json();
      if (d.role === 'admin') {
        setIsAdmin(true);
        toast({ title: 'Admin Mode Active', description: 'Your account has admin privileges.' });
      } else {
        toast({ title: 'Access Denied', description: 'Your account does not have admin privileges.', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Could not verify role.', variant: 'destructive' });
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  };

  const deleteJob = async (id: string) => {
    if (!confirm("Are you sure you want to delete this job card?")) return;
    
    try {
      const response = await fetch(`/api/jobs/${id}`, { method: 'DELETE' });
      if (response.ok) {
        toast({ title: "Job Deleted", description: "The job card has been removed." });
        fetchJobs();
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete job.", variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-[#1B3D6D] animate-spin" />
        <p className="text-slate-500 mt-4">Loading job history...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-[#1B3D6D]">Job History</h1>
          <Button type="button" variant="ghost" size="icon" className="text-slate-400 hover:text-slate-600 rounded-full h-8 w-8 ml-2" onClick={handleAdminToggle} title="Toggle Admin Mode">
            {isAdmin ? <Unlock className="w-4 h-4 text-green-600" /> : <Lock className="w-4 h-4" />}
          </Button>
        </div>
        <div className="flex gap-2">
          <Link href="/">
            <Button className="bg-[#1B3D6D] text-white hover:bg-[#142d50]">
              New Job Card
            </Button>
          </Link>
          <Button variant="outline" onClick={handleLogout} className="gap-2 border-slate-200 text-slate-600 hover:bg-slate-50">
            Sign Out
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {jobs.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
            <p className="text-slate-500">No job cards found. Start by creating one!</p>
          </div>
        ) : (
          jobs.map((job) => (
            <Card key={job.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3 border-b border-slate-100 mb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg font-bold text-[#1B3D6D]">
                      {job.customer_name || 'Unnamed Client'}
                    </CardTitle>
                    <p className="text-sm text-slate-500 font-medium tracking-tight">
                      Job #: {job.quote_number || 'N/A'}
                    </p>
                  </div>
                  <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                    job.status === 'invoiced' ? 'bg-emerald-100 text-emerald-700' : 
                    job.status === 'submitted' ? 'bg-sky-100 text-sky-700' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {job.status}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm text-slate-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    {new Date(job.date).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span className="truncate">{job.address}</span>
                  </div>
                  {isAdmin && (
                    <div className="text-lg font-bold text-[#1B3D6D] pt-2">
                      ${job.grand_total.toLocaleString()}
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-4 border-t border-slate-100">
                  {isAdmin && (
                    job.pdf_url ? (
                      <a href={job.pdf_url} target="_blank" rel="noopener noreferrer" className="flex-1">
                        <Button variant="outline" size="sm" className="w-full gap-2 border-sky-200 text-sky-700 hover:bg-sky-50">
                          <FileText className="w-4 h-4" /> PDF
                        </Button>
                      </a>
                    ) : (
                      <Button disabled variant="outline" size="sm" className="flex-1 gap-2 opacity-50">
                        <FileText className="w-4 h-4" /> No PDF
                      </Button>
                    )
                  )}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="border-slate-200 text-slate-600 hover:bg-slate-50"
                    onClick={() => toast({ title: "Coming Soon", description: "Edit functionality is being prioritized." })}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="border-rose-100 text-rose-500 hover:bg-rose-50 hover:border-rose-200"
                    onClick={() => deleteJob(job.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
