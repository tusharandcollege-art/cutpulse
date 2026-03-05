import { NextRequest, NextResponse } from 'next/server';
import DodoPayments from 'dodopayments';

const dodo = new DodoPayments({
    bearerToken: process.env.DODO_PAYMENTS_API_KEY!,
    environment: (process.env.NEXT_PUBLIC_DODO_ENVIRONMENT as 'live_mode' | 'test_mode') ?? 'live_mode',
});

export async function POST(req: NextRequest) {
    try {
        const {
            planId,
            planName,
            productId,  // Dodo product ID created in dashboard
            price,      // USD amount (dollars, e.g. 9.99)
            points,
            customer_id,
            customer_email,
            customer_name,
            billing,    // billing period: 'monthly' | 'yearly'
        } = await req.json();

        if (!process.env.DODO_PAYMENTS_API_KEY) {
            return NextResponse.json({ error: 'Dodo Payments API key missing' }, { status: 500 });
        }

        if (!productId) {
            return NextResponse.json({ error: 'Product ID is required for Dodo checkout' }, { status: 400 });
        }

        const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL}/pricing?dodo_success=1&plan=${planId}&points=${points}`;

        // Create a checkout session — Dodo redirects user to a hosted page
        const session = await dodo.checkoutSessions.create({
            product_cart: [{ product_id: productId, quantity: 1 }],
            customer: {
                email: customer_email || 'user@cutpulse.com',
                name: customer_name || 'CutPulse User',
            },
            return_url: returnUrl,
            // Pass metadata to identify this purchase after webhook confirmation
            metadata: {
                uid: customer_id,
                planId,
                planName,
                points: String(points),
                billing,
            },
        });

        return NextResponse.json({
            checkout_url: (session as any).checkout_url,
            payment_id: (session as any).payment_id,
        });
    } catch (e: any) {
        console.error('Dodo Create Session Error:', e?.message || e);
        return NextResponse.json({ error: e.message || 'Failed to create Dodo checkout session' }, { status: 500 });
    }
}
