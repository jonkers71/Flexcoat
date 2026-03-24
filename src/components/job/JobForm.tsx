"use client";

import React, { useEffect, useState } from 'react';
import { useForm, useFieldArray, FormProvider, useFormContext } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { JobSchema, JobFormData } from '@/lib/schema';
import { INITIAL_SECTIONS, Job } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Save, FileText, Download, Loader2, RotateCcw, Camera, PenTool, CheckCircle, History, Search, Lock, Unlock, Calendar } from 'lucide-react';
import PDFDownload from './PDFDownload';
import { useToast } from "@/hooks/use-toast";
import { pdf } from '@react-pdf/renderer';
import { JobPDF } from './JobPDF';
import { supabase } from '@/lib/supabase';
import PhotoUpload from './PhotoUpload';
import SignatureCapture from './SignatureCapture';
import Link from 'next/link';

export default function JobForm() {
  const { toast } = useToast();
  const form = useForm<JobFormData>({
    resolver: zodResolver(JobSchema),
    defaultValues: {
      customerName: '',
      address: '',
      quoteNumber: '',
      date: new Date().toISOString().split('T')[0],
      sections: INITIAL_SECTIONS as any,
      grandTotal: 0,
      status: 'draft',
      photos: [],
    },
  });

  const { control, register, handleSubmit, watch, setValue, reset, formState: { errors, isSubmitting } } = form;

  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const savedAdmin = sessionStorage.getItem('flexcoat-admin');
    if (savedAdmin === 'true') {
      setIsAdmin(true);
    }
  }, []);

  const handleAdminToggle = async () => {
    if (isAdmin) {
      setIsAdmin(false);
      sessionStorage.removeItem('flexcoat-admin');
      toast({ title: 'Admin Mode Disabled' });
      return;
    }
    const pin = window.prompt("Enter Admin PIN:");
    if (!pin) return;

    try {
      const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(pin));
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      // SHA-256 hash for the PIN
      if (hashHex === "7e2fd71095f5f159b8f16d10c991a8b71b060d97f10cf442c977d3c9bcfbc3bd") {
        setIsAdmin(true);
        sessionStorage.setItem('flexcoat-admin', 'true');
        toast({ title: 'Admin Mode Enabled' });
      } else {
        toast({ title: 'Incorrect PIN', variant: 'destructive' });
      }
    } catch (err) {
      console.error(err);
      toast({ title: 'Error verifying PIN', variant: 'destructive' });
    }
  };

  const { fields: sectionFields } = useFieldArray({
    control,
    name: "sections",
  });

  // Watch all items to calculate grand total and save draft
  const watchedFormData = watch();

  // Save draft to localStorage
  useEffect(() => {
    const draft = JSON.stringify(watchedFormData);
    localStorage.setItem('flexcoat-job-draft', draft);
  }, [watchedFormData]);

  // Load draft functionality
  const restoreDraft = () => {
    const savedDraft = localStorage.getItem('flexcoat-job-draft');
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        // We only reset if the draft has actual data
        if (parsed.customerName || parsed.quoteNumber || parsed.address) {
          reset(parsed);
          toast({
            title: "Draft Restored",
            description: "Your previous progress has been loaded.",
          });
        }
      } catch (e) {
        console.error("Failed to parse draft", e);
      }
    }
  };

  const fetchQuoteDetails = async () => {
    const quoteNum = watch("quoteNumber");
    if (!quoteNum) {
      toast({ title: "Enter Quote #", description: "Please enter a quote number to search.", variant: "destructive" });
      return;
    }

    try {
      toast({ title: "Searching...", description: "Looking up previous records." });
      const { data, error } = await supabase
        .from('jobs')
        .select('customer_name, address')
        .eq('quote_number', quoteNum)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;
      
      if (data && data.length > 0) {
        setValue("customerName", data[0].customer_name);
        setValue("address", data[0].address);
        toast({ title: "Details Found", description: "Customer and address have been populated." });
      } else {
        toast({ title: "No Record Found", description: "Could not find a previous job with this quote number." });
      }
    } catch (err) {
      console.error("Fetch quote error", err);
      toast({ title: "Search Failed", description: "There was an error searching for records.", variant: "destructive" });
    }
  };

  useEffect(() => {
    if (!watchedFormData.sections) return;
    const total = (watchedFormData.sections as any[]).reduce((acc, section) => {
      if (!section?.items) return acc;
      return acc + section.items.reduce((secAcc: number, item: any) => {
        const itemTotal = (Number(item?.quantity) || 0) * (Number(item?.rate) || 0);
        return secAcc + itemTotal;
      }, 0);
    }, 0);
    setValue("grandTotal", total);
  }, [watchedFormData.sections, setValue]);

  const onSubmit = async (data: JobFormData) => {
    try {
      // Capture Geolocation if available
      let location = data.location;
      if (!location && "geolocation" in navigator) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
          });
          location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
        } catch (geoError) {
          console.warn("Geolocation failed", geoError);
        }
      }

      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, location }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save job card');
      }

      const jobId = result.data[0].id;

      // 1. Generate PDF Blob (Only if admin, otherwise we don't need it)
      let publicUrl = null;
      if (isAdmin) {
        const blob = await pdf(<JobPDF job={{ ...data, location } as any} />).toBlob();
        
        // 2. Upload PDF to Supabase Storage
        const fileName = `JobCard_${data.quoteNumber}_${Date.now()}.pdf`;
        const { error: uploadError } = await supabase.storage
          .from('job-cards')
          .upload(fileName, blob);

        if (uploadError) {
          console.error("PDF Upload Failed", uploadError);
        } else {
          const { data: urlData } = supabase.storage
            .from('job-cards')
            .getPublicUrl(fileName);
          publicUrl = urlData.publicUrl;
          
          // Update job with PDF URL
          await supabase
            .from('jobs')
            .update({ pdf_url: publicUrl })
            .eq('id', jobId);
        }
      }

      // 3. Trigger Email Notification
      await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          jobData: data,
          recipientEmail: 'office@flexcoat.com.au' // User-configurable later
        }),
      });

      toast({
        title: "Success!",
        description: "Job card has been saved and notification sent.",
      });
    } catch (error: any) {
      console.error('Submission error:', error);
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  const handleClearForm = () => {
    if (window.confirm("Are you sure you want to clear the entire form? All unsaved changes will be lost.")) {
      reset({
        customerName: '',
        address: '',
        quoteNumber: '',
        date: new Date().toISOString().split('T')[0],
        sections: INITIAL_SECTIONS as any,
        grandTotal: 0,
        status: 'draft',
      });
      toast({
        title: "Form Cleared",
        description: "The job card has been reset to default values.",
      });
    }
  };

  return (
    <FormProvider {...form}>
      <form onSubmit={handleSubmit(onSubmit as any)} className="max-w-4xl mx-auto p-4 md:p-8 space-y-8 pb-32">
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
            <Button 
              type="button"
              variant="outline"
              onClick={handleClearForm}
              className="gap-2 border-slate-200 text-slate-600 hover:bg-slate-50 w-full sm:w-auto"
            >
              <RotateCcw className="w-4 h-4" />
              Clear Form
            </Button>
            <Button 
              type="button"
              variant="outline"
              onClick={restoreDraft}
              className="gap-2 border-slate-300 hover:bg-slate-50 w-full sm:w-auto"
            >
              <RotateCcw className="w-4 h-4" /> Restore Draft
            </Button>
            <Link href="/jobs" className="w-full sm:w-auto">
              <Button type="button" variant="outline" className="gap-2 border-slate-300 hover:bg-slate-50 w-full">
                <History className="w-4 h-4" /> History
              </Button>
            </Link>
            <Button type="button" variant="ghost" className="w-full sm:w-auto text-slate-400 hover:text-slate-600" onClick={handleAdminToggle} title="Toggle Admin Mode">
              {isAdmin ? <Unlock className="w-4 h-4 text-green-600" /> : <Lock className="w-4 h-4" />}
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="gap-2 bg-[#1B3D6D] hover:bg-[#142d50] text-white w-full sm:w-auto"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {isAdmin ? "Save to Database" : "Submit & Email"}
            </Button>
            {isAdmin && (
              <div className="w-full sm:w-auto">
                <PDFDownload job={watch() as any as Job} />
              </div>
            )}
          </div>
        </div>

        {/* Client Information */}
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg">Client Information</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Customer Name</label>
              <Input 
                {...register("customerName")}
                placeholder="e.g. John Smith" 
              />
              {errors.customerName && <p className="text-xs text-destructive">{errors.customerName.message}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Quote / Job #</label>
              <div className="flex gap-2">
                <Input 
                  {...register("quoteNumber")}
                  placeholder="e.g. Q-4500" 
                  className="flex-1"
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  size="icon" 
                  onClick={fetchQuoteDetails}
                  title="Auto-fetch from previous jobs"
                  className="border-slate-200"
                >
                  <Search className="w-4 h-4 text-slate-500" />
                </Button>
              </div>
              {errors.quoteNumber && <p className="text-xs text-destructive">{errors.quoteNumber.message}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Site Address</label>
              <Input 
                {...register("address")}
                placeholder="123 Example St, Suburb" 
              />
              {errors.address && <p className="text-xs text-destructive">{errors.address.message}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Date</label>
              <div className="relative">
                <Input 
                  type="date"
                  {...register("date")}
                  className="pl-10"
                />
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
              {errors.date && <p className="text-xs text-destructive">{errors.date.message}</p>}
            </div>
          </CardContent>
        </Card>

        {/* Form Sections */}
        {sectionFields.map((section, sectionIndex) => (
          <SectionItem key={section.id} sectionIndex={sectionIndex} section={section} isAdmin={isAdmin} />
        ))}

        {/* Site Photos */}
        <Card className="border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Camera className="w-5 h-5 text-slate-400" />
              Site Photos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PhotoUpload 
              existingPhotos={watch("photos")}
              onUpload={(url) => {
                const current = watch("photos") || [];
                setValue("photos", [...current, url]);
              }}
              onRemove={(url) => {
                const current = watch("photos") || [];
                setValue("photos", current.filter(p => p !== url));
              }}
            />
          </CardContent>
        </Card>

        {/* Sign-off Section */}
        <Card className="border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <PenTool className="w-5 h-5 text-slate-400" />
              Sign-off
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SignatureCapture 
              label="Operator Signature"
              existingSignature={watch("operatorSignature")}
              onSave={(base64) => setValue("operatorSignature", base64)}
              onClear={() => setValue("operatorSignature", undefined)}
            />
            <SignatureCapture 
              label="Client Signature"
              existingSignature={watch("clientSignature")}
              onSave={(base64) => setValue("clientSignature", base64)}
              onClear={() => setValue("clientSignature", undefined)}
            />
          </CardContent>
        </Card>

        {/* Total Bar */}
        {isAdmin && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 shadow-lg z-10">
            <div className="max-w-4xl mx-auto flex justify-between items-center">
              <div className="text-sm text-slate-500 font-medium uppercase tracking-wider">Estimated Total</div>
              <div className="text-3xl font-black text-[#0096D6]">
                ${watch("grandTotal").toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        )}
      </form>
    </FormProvider>
  );
}

function SectionItem({ sectionIndex, section, isAdmin }: { sectionIndex: number, section: any, isAdmin: boolean }) {
  const { control } = useFormContext();
  const { fields: itemFields, append, remove } = useFieldArray({
    control,
    name: `sections.${sectionIndex}.items` as const,
  });

  return (
    <Card className="border-slate-200 shadow-sm overflow-hidden">
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
                {isAdmin && <th className="px-4 py-3 font-medium w-32 text-center">Rate</th>}
                {isAdmin && <th className="px-6 py-3 font-medium w-32 text-right">Total</th>}
                {!isAdmin && <th className="px-6 py-3 font-medium w-16 text-right"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {itemFields.map((item, itemIndex) => (
                <ItemRow 
                  key={item.id} 
                  sectionIndex={sectionIndex} 
                  itemIndex={itemIndex} 
                  onRemove={() => remove(itemIndex)} 
                  isAdmin={isAdmin}
                />
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t bg-slate-50/30">
          <Button 
            type="button"
            variant="ghost" 
            size="sm" 
            className="text-slate-500 hover:text-[#0096D6] gap-2"
            onClick={() => append({ id: Math.random().toString(36).substr(2, 9), name: "New item", unit: "qty", quantity: 0, rate: 0, total: 0 })}
          >
            <Plus className="w-4 h-4" /> Add custom item
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ItemRow({ sectionIndex, itemIndex, onRemove, isAdmin }: { sectionIndex: number, itemIndex: number, onRemove: () => void, isAdmin: boolean }) {
  const { register, watch } = useFormContext();
  
  const qty = watch(`sections.${sectionIndex}.items.${itemIndex}.quantity`);
  const rate = watch(`sections.${sectionIndex}.items.${itemIndex}.rate`);
  const total = (Number(qty) || 0) * (Number(rate) || 0);

  return (
    <tr className="hover:bg-slate-50/30 transition-colors group">
      <td className="px-6 py-4">
        <Input 
          className="font-medium text-slate-700 bg-transparent border-none shadow-none focus-visible:ring-1 h-8 px-1"
          {...register(`sections.${sectionIndex}.items.${itemIndex}.name`)}
        />
      </td>
      <td className="px-4 py-4 text-center text-slate-500">
        {watch(`sections.${sectionIndex}.items.${itemIndex}.unit`)}
      </td>
      <td className="px-4 py-4">
        <Input 
          type="number" 
          step="any"
          className="text-center h-8" 
          {...register(`sections.${sectionIndex}.items.${itemIndex}.quantity`, { valueAsNumber: true })}
        />
      </td>
      {isAdmin && (
        <td className="px-4 py-4">
          <Input 
            type="number" 
            step="any"
            className="text-center h-8" 
            {...register(`sections.${sectionIndex}.items.${itemIndex}.rate`, { valueAsNumber: true })}
          />
        </td>
      )}
      {isAdmin ? (
        <td className="px-6 py-4 text-right">
          <div className="flex items-center justify-end gap-3">
            <span className="font-semibold text-slate-900">
              ${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <button 
              type="button"
              onClick={onRemove}
              className="text-slate-300 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </td>
      ) : (
        <td className="px-6 py-4 text-right">
          <button 
            type="button"
            onClick={onRemove}
            className="text-slate-300 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </td>
      )}
    </tr>
  );
}
