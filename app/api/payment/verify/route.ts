import { NextRequest, NextResponse } from 'next/server';
import { Cashfree, CFEnvironment } from "cashfree-pg";

export async function POST(req: NextRequest) {
    try {
        const { order_id } = await req.json();

        if (!process.env.CASHFREE_APP_ID || !process.env.CASHFREE_SECRET_KEY) {
            return NextResponse.json({ error: 'Cashfree credentials missing in .env.local' }, { status: 500 });
        }

        const cashfreeEnvironment = process.env.CASHFREE_ENVIRONMENT === 'PRODUCTION' ? CFEnvironment.PRODUCTION : CFEnvironment.SANDBOX;

        // Instantiating v5 Cashfree SDK
        const cashfree = new Cashfree(cashfreeEnvironment as any, process.env.CASHFREE_APP_ID, process.env.CASHFREE_SECRET_KEY);

        const response = await cashfree.PGOrderFetchPayments(order_id);
        const payments = response.data;

        // Check if any payment attempt was successful
        const isPaid = payments.some((payment: any) => payment.payment_status === "SUCCESS");

        if (isPaid) {
            return NextResponse.json({ success: true, message: 'Payment verified successfully.' });
        } else {
            return NextResponse.json({ success: false, message: 'Payment not successful yet.' }, { status: 400 });
        }
    } catch (e: any) {
        console.error("Cashfree Verify Order Error:", e.response?.data || e);
        return NextResponse.json({ error: e.message || 'Payment verification failed' }, { status: 500 });
    }
}
