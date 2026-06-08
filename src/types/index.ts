export type OrderStatus = 'pending_payment' | 'payment_received' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
export type PaymentMode = 'upi' | 'card' | 'netbanking' | 'cod' | 'partial';
export type MessageSource = 'instagram' | 'whatsapp';
export type AgentMessageRole = 'customer' | 'agent' | 'merchant';

export interface PartialPayment {
  advancePaid: number;
  balanceDue: number;
  balanceDueDate: string;
  balancePaid: boolean;
}

export interface ShipmentInfo {
  awb: string;
  courier: string;
  trackingUrl: string;
  triggeredAt: string;
  status: 'pending' | 'pickup_scheduled' | 'in_transit' | 'delivered';
}

export interface ProductVariant {
  label: string;   // "Size" | "Colour" | "Length" | any custom label
  options: string[];
}

export interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  customerWhatsapp: string;
  product: string;
  amount: number;
  status: OrderStatus;
  paymentMode: PaymentMode;
  paymentId?: string;
  source: MessageSource;
  createdAt: string;
  paidAt?: string;
  partial?: PartialPayment;
  shipment?: ShipmentInfo;
  whatsappConfirmationSent: boolean;
  receiptSent: boolean;
  notes?: string;
}

export interface WorkflowAction {
  id: string;
  type: 'whatsapp_confirmation' | 'shiprocket_push' | 'google_sheet' | 'receipt_pdf' | 'webhook';
  enabled: boolean;
  config: Record<string, string>;
}

export interface WorkflowRule {
  id: string;
  name: string;
  trigger: 'payment_success' | 'payment_failed' | 'partial_received' | 'balance_due';
  actions: WorkflowAction[];
}

export interface DmMessage {
  id: string;
  role: AgentMessageRole;
  content: string;
  timestamp: string;
  attachmentUrl?: string;
}

export interface DmConversation {
  id: string;
  customerName: string;
  customerHandle: string;
  source: MessageSource;
  messages: DmMessage[];
  stage: 'inquiry' | 'negotiation' | 'link_sent' | 'paid' | 'shipped';
  linkedOrderId?: string;
}

export interface ReconciliationEntry {
  orderId: string;
  customerName: string;
  amount: number;
  paymentMode: PaymentMode;
  razorpaySettlement?: number;
  matched: boolean;
  flag?: string;
}
