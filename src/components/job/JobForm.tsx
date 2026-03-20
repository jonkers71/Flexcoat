"use client";

import React, { useEffect } from 'react';
import { useForm, useFieldArray, FormProvider, useFormContext } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { JobSchema, JobFormData } from '@/lib/schema';
import { INITIAL_SECTIONS, Job } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Save, FileText, Download, Loader2 } from 'lucide-react';
import PDFDownload from './PDFDownload';
import { useToast } from "@/hooks/use-toast";

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
    },
  });

  const { control, register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = form;

  const { fields: sectionFields } = useFieldArray({
    control,
    name: "sections",
  });

  // Watch all items to calculate grand total
  const watchedSections = watch("sections");

  useEffect(() => {
    if (!watchedSections) return;
    const total = watchedSections.reduce((acc, section) => {
      if (!section?.items) return acc;
      return acc + section.items.reduce((secAcc, item) => {
        const itemTotal = (Number(item.quantity) || 0) * (Number(item.rate) || 0);
        return secAcc + itemTotal;
      }, 0);
    }, 0);
    setValue("grandTotal", total);
  }, [watchedSections, setValue]);

  const onSubmit = async (data: JobFormData) => {
    try {
      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to save job card');
      }

      toast({
        title: "Success",
        description: "Job card saved to database",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
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
              type="submit" 
              disabled={isSubmitting}
              className="gap-2 bg-[#1B3D6D] hover:bg-[#142d50] text-white w-full sm:w-auto"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save to Database
            </Button>
            <div className="w-full sm:w-auto">
              <PDFDownload job={watch() as any as Job} />
            </div>
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
              <Input 
                {...register("quoteNumber")}
                placeholder="e.g. Q-4500" 
              />
              {errors.quoteNumber && <p className="text-xs text-destructive">{errors.quoteNumber.message}</p>}
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-slate-700">Site Address</label>
              <Input 
                {...register("address")}
                placeholder="123 Example St, Suburb" 
              />
              {errors.address && <p className="text-xs text-destructive">{errors.address.message}</p>}
            </div>
          </CardContent>
        </Card>

        {/* Form Sections */}
        {sectionFields.map((section, sectionIndex) => (
          <SectionItem key={section.id} sectionIndex={sectionIndex} section={section} />
        ))}

        {/* Total Bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 shadow-lg z-10">
          <div className="max-w-4xl mx-auto flex justify-between items-center">
            <div className="text-sm text-slate-500 font-medium uppercase tracking-wider">Estimated Total</div>
            <div className="text-3xl font-black text-[#0096D6]">
              ${watch("grandTotal").toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        </div>
      </form>
    </FormProvider>
  );
}

function SectionItem({ sectionIndex, section }: { sectionIndex: number, section: any }) {
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
                <th className="px-4 py-3 font-medium w-32 text-center">Rate</th>
                <th className="px-6 py-3 font-medium w-32 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {itemFields.map((item, itemIndex) => (
                <ItemRow 
                  key={item.id} 
                  sectionIndex={sectionIndex} 
                  itemIndex={itemIndex} 
                  onRemove={() => remove(itemIndex)} 
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

function ItemRow({ sectionIndex, itemIndex, onRemove }: { sectionIndex: number, itemIndex: number, onRemove: () => void }) {
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
          className="text-center h-8"
          {...register(`sections.${sectionIndex}.items.${itemIndex}.quantity`, { valueAsNumber: true })}
        />
      </td>
      <td className="px-4 py-4">
        <Input 
          type="number" 
          className="text-center h-8" 
          {...register(`sections.${sectionIndex}.items.${itemIndex}.rate`, { valueAsNumber: true })}
        />
      </td>
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
    </tr>
  );
}
