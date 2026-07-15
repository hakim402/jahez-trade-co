export type ShipmentStatusValue =
  | "BOOKED"
  | "PICKED_UP"
  | "IN_TRANSIT"
  | "ARRIVED_ORIGIN_PORT"
  | "CUSTOMS_ORIGIN"
  | "DEPARTED"
  | "ARRIVED_DESTINATION"
  | "CUSTOMS_DESTINATION"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "DELAYED"
  | "EXCEPTION"
  | "CANCELED"
  | "RETURNED";

export type FreightTypeValue = "AIR" | "SEA" | "LAND" | "EXPRESS";
export type TrackingSourceValue = "MANUAL" | "API_17TRACK" | "API_SHIP24" | "API_AFTERSHIP";

export interface ShipmentClient {
  id: string;
  fullName: string | null;
  email: string;
  phone: string | null;
}

export interface ShipmentGuestClient {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  whatsappPhone?: string | null;
  company?: string | null;
}

export interface ShipmentImageRow {
  id: string;
  url: string;
  altText: string | null;
  isPrimary: boolean;
  sortOrder: number;
}

export interface ShipmentEventRow {
  id: string;
  status: ShipmentStatusValue;
  title: string;
  titleAr: string | null;
  description: string | null;
  descriptionAr: string | null;
  location: string | null;
  occurredAt: string;
  source: "MANUAL" | "API" | "SYSTEM";
  createdAt: string;
}

export interface InvoiceItemRow {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface InvoiceRow {
  id: string;
  invoiceNumber: string;
  subtotal: number;
  taxAmount: number;
  discount: number;
  totalAmount: number;
  currency: string;
  status: string;
  dueDate: string | null;
  pdfUrl: string | null;
  emailSentAt: string | null;
  whatsappSentAt: string | null;
  createdAt: string;
  items: InvoiceItemRow[];
}

export interface ShipmentRow {
  id: string;
  trackingCode: string;
  clientId: string | null;
  client: ShipmentClient | null;
  guestClientId: string | null;
  guestClient: ShipmentGuestClient | null;
  productDescription: string;
  productLink: string | null;
  quantity: number | null;
  originCountry: string;
  destinationCountry: string;
  freightType: FreightTypeValue;
  carrierName: string | null;
  carrierTrackingNumber: string | null;
  trackingSource: TrackingSourceValue;
  autoSyncEnabled: boolean;
  lastSyncedAt: string | null;
  lastSyncError: string | null;
  weightKg: number | null;
  volumeCbm: number | null;
  productCost: number;
  shippingCost: number;
  customsFees: number;
  otherFees: number;
  currency: string;
  status: ShipmentStatusValue;
  estimatedDelivery: string | null;
  actualDelivery: string | null;
  images: ShipmentImageRow[];
  events?: ShipmentEventRow[];
  invoices?: InvoiceRow[];
  createdAt: string;
  updatedAt: string;
}

export interface ShipmentStats {
  total: number;
  inTransit: number;
  delivered: number;
  delayed: number;
}