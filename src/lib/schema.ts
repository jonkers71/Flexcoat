import { z } from 'zod';

export const JobItemSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Item name is required"),
  unit: z.string(),
  quantity: z.number().min(0, "Quantity must be at least 0").refine(val => !isNaN(val), "Quantity must be a valid number"),
  rate: z.number().min(0, "Rate must be at least 0").refine(val => !isNaN(val), "Rate must be a valid number"),
  total: z.number().min(0, "Total must be at least 0").refine(val => !isNaN(val), "Total must be a valid number"),
})

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
