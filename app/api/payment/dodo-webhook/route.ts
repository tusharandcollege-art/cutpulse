import { NextRequest, NextResponse } from 'next/server';
import { Webhook } from 'standardwebhooks';
import { adminDb } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';

// Dodo sends webhooks signed with your webhook secret (from dashboard → Developer → Webhooks)
const webhook = new Webhook(process.env.DODO_WEBHOOK_SECRET!);

export async function POST(req: NextRequest) {
    try {
        // ── 1. Read raw body (required for signature verification) ─────────
        const rawBody = await req.text();
        const webhookHeaders = {
            'webhook-id': req.headers.get('webhook-id') || '',
            'webhook-signature': req.headers.get('webhook-signature') || '',
            'webhook-timestamp': req.headers.get('webhook-timestamp') || '',
        };

        // ── 2. Verify the Dodo signature — throws if tampered ─────────────
        await webhook.verify(rawBody, webhookHeaders);

        const payload = JSON.parse(rawBody);
        const eventType: string = payload.type || payload.event_type || '';

        console.log('[Dodo Webhook] Event:', eventType);

        // ── 3. Handle successful payment ───────────────────────────────────
        if (eventType === 'payment.succeeded') {
            const paymentData = payload.data || payload;
            const metadata: Record<string, string> = paymentData.metadata || {};

            const uid: string = metadata.uid || '';
            const planId: string = metadata.planId || '';
            const planName: string = metadata.planName || 'Plan';
            const points: number = parseInt(metadata.points || '0', 10);
            const billing: string = metadata.billing || 'monthly';
            // Dodo sends amounts in cents → convert to dollars
            const amountUsd: number = (paymentData.total_amount ?? paymentData.amount ?? 0) / 100;
            const orderId: string = paymentData.payment_id || paymentData.order_id || '';

            if (!uid || points <= 0) {
                console.warn('[Dodo Webhook] ⚠️ Missing uid or points in metadata:', metadata);
                return NextResponse.json({ received: true, warning: 'Missing uid or points' });
            }

            // ── 4. Credit points via Admin SDK (safe from server-side) ─────
            const userRef = adminDb.doc(`users/${uid}`);
            const userSnap = await userRef.get();

            if (!userSnap.exists) {
                console.warn(`[Dodo Webhook] User ${uid} not found in Firestore`);
                return NextResponse.json({ received: true, warning: 'User not found' });
            }

            const userData = userSnap.data() || {};

            // Atomically credit the buyer's points
            await userRef.update({
                points: FieldValue.increment(points),
            });

            // Log transaction in user's sub-collection
            await adminDb.collection(`users/${uid}/transactions`).add({
                amount: points,
                mode: 'plan_purchase',
                model: planName,
                type: 'credit',
                duration: 0,
                createdAt: FieldValue.serverTimestamp(),
            });

            // If user was referred, give referrer a 15% bonus (same logic as client-side)
            if (userData.referredBy) {
                const referrerBonus = Math.floor(points * 0.15);
                const referrerRef = adminDb.doc(`users/${userData.referredBy}`);
                await referrerRef.update({ points: FieldValue.increment(referrerBonus) });
                await adminDb.collection(`users/${userData.referredBy}/transactions`).add({
                    amount: referrerBonus,
                    mode: 'affiliate_commission',
                    model: uid,
                    type: 'credit',
                    duration: 0,
                    createdAt: FieldValue.serverTimestamp(),
                });
            }

            // ── 5. Record purchase in top-level `purchases` collection ─────
            await adminDb.collection('purchases').add({
                uid,
                planName,
                planId,
                amount: amountUsd,
                currency: 'USD',
                gateway: 'dodo',
                orderId,
                billing,
                createdAt: FieldValue.serverTimestamp(),
            });

            console.log(`[Dodo Webhook] ✅ Credited ${points} pts to uid=${uid} | plan=${planName} | $${amountUsd}`);
        }

        return NextResponse.json({ received: true });

    } catch (e: any) {
        console.error('[Dodo Webhook] Error:', e.message || e);
        // Return 400 so Dodo retries delivery
        return NextResponse.json({ error: 'Webhook processing failed' }, { status: 400 });
    }
}
