"use client";

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Job, INITIAL_SECTIONS, JobItem } from '@/lib/types';
import { Plus, Trash2, Save, FileText, Download } from 'lucide-react';
import PDFDownload from './PDFDownload';

export default function JobForm() {
  const [job, setJob] = useState<Job>({
    customerName: '',
    address: '',
    quoteNumber: '',
    date: new Date().toISOString().split('T')[0],
    sections: INITIAL_SECTIONS,
    totalLabour: 0,
    totalExtras: 0,
    grandTotal: 0
  });

  const updateItem = (sectionId: string, itemId: string, field: keyof JobItem, value: string | number) => {
    const newSections = job.sections.map(section => {
      if (section.id !== sectionId) return section;
      
      const newItems = section.items.map(item => {
        if (item.id !== itemId) return item;
        
        const updatedItem = { ...item, [field]: value };
        // Recalculate total
        if (field === 'quantity' || field === 'rate') {
          updatedItem.total = (Number(updatedItem.quantity) || 0) * (Number(updatedItem.rate) || 0);
        }
        return updatedItem;
      });
      
      return { ...section, items: newItems };
    });

    // Calculate grand total
    const grandTotal = newSections.reduce((acc, section) => {
      return acc + section.items.reduce((secAcc, item) => secAcc + item.total, 0);
    }, 0);

    setJob({ ...job, sections: newSections, grandTotal });
  };

  const addItem = (sectionId: string) => {
    const newSections = job.sections.map(section => {
      if (section.id !== sectionId) return section;
      const newItem: JobItem = {
        id: Math.random().toString(36).substr(2, 9),
        name: "New item",
        unit: "qty",
        quantity: 0,
        rate: 0,
        total: 0
      };
      return { ...section, items: [...section.items, newItem] };
    });
    setJob({ ...job, sections: newSections });
  };

  const removeItem = (sectionId: string, itemId: string) => {
    const newSections = job.sections.map(section => {
      if (section.id !== sectionId) return section;
      return { ...section, items: section.items.filter(i => i.id !== itemId) };
    });
    
    // Recalculate grand total
    const grandTotal = newSections.reduce((acc, section) => {
      return acc + section.items.reduce((secAcc, item) => secAcc + item.total, 0);
    }, 0);
    
    setJob({ ...job, sections: newSections, grandTotal });
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 border-b pb-8 text-center md:text-left">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="bg-white p-3 rounded-xl border-2 border-slate-100 shadow-sm">
            <img src="/logo.png" alt="FlexCoat Logo" className="h-16 md:h-20 w-auto object-contain" />
          </div>
          <div className="h-16 w-px bg-slate-200 hidden md:block" />
          <h1 className="text-3xl md:text-4xl font-black text-[#1B3D6D] tracking-tighter">
            Job Card Entry
          </h1>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <Button variant="outline" className="gap-2 border-slate-300 hover:bg-slate-50 w-full sm:w-auto">
            <Save className="w-4 h-4" /> Save Draft
          </Button>
          <div className="w-full sm:w-auto">
            <PDFDownload job={job} />
          </div>
        </div>
      </div>

      {/* 0. Job Information */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg">Client Information</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Customer Name</label>
            <Input 
              placeholder="e.g. John Smith" 
              value={job.customerName}
              onChange={(e) => setJob({...job, customerName: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Quote / Job #</label>
            <Input 
              placeholder="e.g. Q-4500" 
              value={job.quoteNumber}
              onChange={(e) => setJob({...job, quoteNumber: e.target.value})}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-slate-700">Site Address</label>
            <Input 
              placeholder="123 Example St, Suburb" 
              value={job.address}
              onChange={(e) => setJob({...job, address: e.target.value})}
            />
          </div>
        </CardContent>
      </Card>

      {/* 1. Form Sections */}
      {job.sections.map((section) => (
        <Card key={section.id} className="border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-slate-50 border-b px-6 py-4">
            <h2 className="text-lg font-semibold text-slate-800">{section.title}</h2>
          </div>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50/50 border-b">
                  <tr>
                    <th className="px-6 py-3 font-medium">Item Description</th>
                    <th className="px-4 py-3 font-medium w-24 text-center">Unit</th>
                    <th className="px-4 py-3 font-medium w-32 text-center">Qty</th>
                    <th className="px-4 py-3 font-medium w-32 text-center">Rate</th>
                    <th className="px-6 py-3 font-medium w-32 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {section.items.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/30 transition-colors group">
                      <td className="px-6 py-4">
                        <Input 
                          className="font-medium text-slate-700 bg-transparent border-none shadow-none focus-visible:ring-1 h-8 px-1"
                          value={item.name}
                          onChange={(e) => updateItem(section.id, item.id, 'name', e.target.value)}
                        />
                      </td>
                      <td className="px-4 py-4 text-center text-slate-500">{item.unit}</td>
                      <td className="px-4 py-4">
                        <Input 
                          type="number" 
                          className="text-center h-8"
                          value={item.quantity || ''}
                          onChange={(e) => updateItem(section.id, item.id, 'quantity', e.target.value)}
                        />
                      </td>
                      <td className="px-4 py-4">
                        <Input 
                          type="number" 
                          className="text-center h-8" 
                          value={item.rate || ''}
                          onChange={(e) => updateItem(section.id, item.id, 'rate', e.target.value)}
                        />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <span className="font-semibold text-slate-900">
                            ${item.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                          <button 
                            onClick={() => removeItem(section.id, item.id)}
                            className="text-slate-300 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t bg-slate-50/30">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-slate-500 hover:text-sky-600 gap-2"
                onClick={() => addItem(section.id)}
              >
                <Plus className="w-4 h-4" /> Add custom item
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Total Bar (Floating on mobile) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 shadow-lg z-10">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="text-sm text-slate-500 font-medium">ESTIMATED TOTAL</div>
          <div className="text-2xl font-bold text-sky-700">
            ${job.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
      </div>
    </div>
  );
}
