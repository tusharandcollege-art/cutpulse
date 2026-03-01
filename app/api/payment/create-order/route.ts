import { NextRequest, NextResponse } from 'next/server';
import { Cashfree, CFEnvironment } from "cashfree-pg";

export async function POST(req: NextRequest) {
    try {
        const { planId, planName, price, points, customer_id, customer_email, customer_phone, customer_name } = await req.json();

        if (!process.env.CASHFREE_APP_ID || !process.env.CASHFREE_SECRET_KEY) {
            return NextResponse.json({ error: 'Cashfree credentials missing in .env.local' }, { status: 500 });
        }

        const cashfreeEnvironment = process.env.CASHFREE_ENVIRONMENT === 'PRODUCTION' ? CFEnvironment.PRODUCTION : CFEnvironment.SANDBOX;
        const cashfree = new Cashfree(cashfreeEnvironment as any, process.env.CASHFREE_APP_ID, process.env.CASHFREE_SECRET_KEY);

        const order_id = `CF${Date.now()}${Math.floor(Math.random() * 1000)}`;

        // Cashfree requires: customer_id alphanumeric only, phone 10 digits
        const safeCustomerId = (customer_id || 'guest').replace(/[^a-zA-Z0-9]/g, '').slice(0, 50) || 'guest';
        const safePhone = (customer_phone || '9876543210').replace(/\D/g, '').slice(-10).padStart(10, '9');

        const request = {
            order_amount: price,
            order_currency: 'INR', // Cashfree India only supports INR
            order_id: order_id,
            customer_details: {
                customer_id: safeCustomerId,
                customer_phone: safePhone,
                customer_name: customer_name || 'CutPulse User',
                customer_email: customer_email || 'user@cutpulse.com'
            },
            order_meta: {
                return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/pricing?order_id={order_id}&status={order_status}`
            },
            order_tags: {
                points: points.toString(),
                planName: planName,
                uid: customer_id
            }
        };

        const response = await cashfree.PGCreateOrder(request);
        return NextResponse.json({
            payment_session_id: response.data.payment_session_id,
            order_id: response.data.order_id
        });
    } catch (e: any) {
        console.error("Cashfree Create Order Error:", e.response?.data || e);
        return NextResponse.json({ error: e.message || 'Payment initiation failed' }, { status: 500 });
    }
}
