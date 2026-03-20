export interface JobItem {
  id: string;
  name: string;
  unit: 'm2' | 'lm' | 'qty';
  quantity: number;
  rate: number;
  total: number;
}

export interface JobSection {
  id: string;
  title: string;
  items: JobItem[];
}

export interface Job {
  id?: string;
  customerName: string;
  address: string;
  quoteNumber: string;
  date: string;
  sections: JobSection[];
  totalLabour: number;
  totalExtras: number;
  grandTotal: number;
}

export const DEFAULT_PRICING: Record<string, number> = {
  "Shower base (inc. wall/floor joints)": 150.00,
  "Shower walls (to 2.1m)": 85.00,
  "Floor area": 12.00,
  "Wall/floor joints (inc. bond breaker)": 8.50,
  "Waterstops (inc. glue down)": 25.00,
  "Primer": 5.00,
};

export const INITIAL_SECTIONS: JobSection[] = [
  {
    id: "internal_wet_areas",
    title: "1. Internal Wet Areas",
    items: [
      { id: "1-1", name: "Shower base (inc. wall/floor joints)", unit: "qty", quantity: 0, rate: 150.00, total: 0 },
      { id: "1-2", name: "Shower walls (to 2.1m)", unit: "m2", quantity: 0, rate: 85.00, total: 0 },
      { id: "1-3", name: "Floor area", unit: "m2", quantity: 0, rate: 12.00, total: 0 },
      { id: "1-4", name: "Wall/floor joints (inc. bond breaker)", unit: "lm", quantity: 0, rate: 8.50, total: 0 },
      { id: "1-5", name: "Waterstops (inc. glue down)", unit: "lm", quantity: 0, rate: 25.00, total: 0 },
      { id: "1-6", name: "Primer", unit: "m2", quantity: 0, rate: 5.00, total: 0 },
    ]
  },
  {
    id: "external_wet_areas",
    title: "2. External Wet Areas (Balconies/Decks)",
    items: [
      { id: "2-1", name: "Main balcony area", unit: "m2", quantity: 0, rate: 45.00, total: 0 },
      { id: "2-2", name: "Perimeter joints / Upstands", unit: "lm", quantity: 0, rate: 12.00, total: 0 },
    ]
  },
  {
    id: "retaining_walls",
    title: "3. Retaining Walls & Planter Boxes",
    items: [
      { id: "3-1", name: "Retaining wall area", unit: "m2", quantity: 0, rate: 55.00, total: 0 },
      { id: "3-2", name: "Planter box (internal)", unit: "m2", quantity: 0, rate: 65.00, total: 0 },
      { id: "3-3", name: "Fillet / Joint treatment", unit: "lm", quantity: 0, rate: 9.50, total: 0 },
    ]
  },
  {
    id: "window_reveals",
    title: "4. Window Reveals",
    items: [
      { id: "4-1", name: "Standard window reveal", unit: "qty", quantity: 0, rate: 45.00, total: 0 },
      { id: "4-2", name: "Large sliding door reveal", unit: "qty", quantity: 0, rate: 85.00, total: 0 },
    ]
  },
  {
    id: "labour_travel",
    title: "5. Labour, Travel & Fees",
    items: [
      { id: "5-1", name: "Standard Labour (per hour)", unit: "qty", quantity: 0, rate: 85.00, total: 0 },
      { id: "5-2", name: "Travel / Call-out Fee", unit: "qty", quantity: 0, rate: 120.00, total: 0 },
      { id: "5-3", name: "Waste Disposal Fee", unit: "qty", quantity: 0, rate: 50.00, total: 0 },
    ]
  }
];
