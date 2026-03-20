import { z } from 'zod';

export const JobItemSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Item name is required"),
  unit: z.string(),
  quantity: z.number().min(0),
  rate: z.number().min(0),
  total: z.number().min(0),
});

export const JobSectionSchema = z.object({
  id: z.string(),
  title: z.string(),
  items: z.array(JobItemSchema),
});

export const JobSchema = z.object({
  id: z.string().optional(),
  customerName: z.string().min(1, "Customer name is required"),
  quoteNumber: z.string().min(1, "Quote/Job number is required"),
  address: z.string().min(1, "Site address is required"),
  date: z.string(),
  sections: z.array(JobSectionSchema),
  grandTotal: z.number(),
  status: z.enum(['draft', 'submitted', 'invoiced']),
});

export type JobFormData = z.infer<typeof JobSchema>;
