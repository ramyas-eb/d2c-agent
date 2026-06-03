// Shiprocket service — real API when configured, mock otherwise

let cachedToken: string | null = null;

async function getToken(): Promise<string> {
  if (cachedToken) return cachedToken;
  const res = await fetch('https://apiv2.shiprocket.in/v1/external/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: process.env.SHIPROCKET_EMAIL,
      password: process.env.SHIPROCKET_PASSWORD,
    }),
  });
  const data = await res.json();
  cachedToken = data.token;
  return cachedToken!;
}

export function isShiprocketConfigured() {
  return !!(process.env.SHIPROCKET_EMAIL && process.env.SHIPROCKET_PASSWORD);
}

export interface ShiprocketOrderParams {
  orderId: string;
  orderDate: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  address: string;
  city: string;
  pincode: string;
  state: string;
  items: { name: string; sku: string; units: number; sellingPrice: number }[];
  totalAmount: number;
  paymentMethod: 'Prepaid' | 'COD';
}

export async function createShiprocketOrder(params: ShiprocketOrderParams) {
  if (!isShiprocketConfigured()) {
    return {
      order_id: `SR_MOCK_${Date.now()}`,
      shipment_id: `SHIP_MOCK_${Date.now()}`,
      awb_code: `SR${Math.floor(Math.random() * 9000000000) + 1000000000}`,
      courier_name: 'Delhivery',
      tracking_url: `https://shiprocket.co/tracking/SR${Math.floor(Math.random() * 9000000000)}`,
    };
  }

  const token = await getToken();
  const orderRes = await fetch('https://apiv2.shiprocket.in/v1/external/orders/create/adhoc', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      order_id: params.orderId,
      order_date: params.orderDate,
      pickup_location: 'Primary',
      billing_customer_name: params.customerName.split(' ')[0],
      billing_last_name: params.customerName.split(' ').slice(1).join(' ') || '.',
      billing_phone: params.customerPhone,
      billing_address: params.address,
      billing_city: params.city,
      billing_pincode: params.pincode,
      billing_state: params.state,
      billing_country: 'India',
      billing_email: params.customerEmail || 'noreply@shop.in',
      shipping_is_billing: true,
      order_items: params.items.map((i) => ({
        name: i.name,
        sku: i.sku,
        units: i.units,
        selling_price: i.sellingPrice,
      })),
      payment_method: params.paymentMethod,
      sub_total: params.totalAmount,
      length: 30,
      breadth: 20,
      height: 10,
      weight: 0.5,
    }),
  });
  const order = await orderRes.json();

  // Step 2: assign courier + generate AWB
  if (order.shipment_id) {
    const awbRes = await fetch('https://apiv2.shiprocket.in/v1/external/courier/assign/awb', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ shipment_id: order.shipment_id }),
    });
    const awbData = await awbRes.json();
    if (awbData.response?.data?.awb_code) {
      order.awb_code    = awbData.response.data.awb_code;
      order.courier_name = awbData.response.data.courier_name;
      order.tracking_url = `https://shiprocket.co/tracking/${awbData.response.data.awb_code}`;
    }
  }

  return order;
}
