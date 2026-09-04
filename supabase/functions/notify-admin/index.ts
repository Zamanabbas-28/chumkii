// Supabase Edge Function: notify-admin
// Secrets: RESEND_API_KEY, ADMIN_NOTIFICATION_EMAIL, ADMIN_SITE_URL, RESEND_FROM

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const resendKey = Deno.env.get('RESEND_API_KEY')
    if (!resendKey) {
      return new Response(JSON.stringify({ ok: false, error: 'RESEND_API_KEY missing' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const body = await req.json().catch(() => ({}))
    const record = body.record || body
    const type = record.type || body.type
    const orderId = record.order_id || body.order_id
    const payload = record.payload || body.payload || {}

    if (!type || !['new_order', 'payment_proof'].includes(type)) {
      return new Response(JSON.stringify({ ok: true, skipped: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const supabase = createClient(supabaseUrl, serviceKey)

    let toEmail = Deno.env.get('ADMIN_NOTIFICATION_EMAIL') || 'noxshiniii@gmail.com'
    const { data: setting } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'admin_notification_email')
      .maybeSingle()
    if (setting?.value) toEmail = setting.value

    let order = null
    if (orderId) {
      const { data } = await supabase.from('orders').select('*').eq('id', orderId).maybeSingle()
      order = data
    }

    const site = Deno.env.get('ADMIN_SITE_URL') || 'https://chumkii.vercel.app'
    const orderNumber = (order && order.order_number) || payload.order_number || '—'
    const link = orderId ? `${site}/admin/orders/${orderId}` : `${site}/admin/orders`

    let subject = ''
    let html = ''

    if (type === 'new_order') {
      subject = `New Chumki Order #${orderNumber}`
      html = `
        <h2>New Chumki Order</h2>
        <p><strong>Order:</strong> ${orderNumber}</p>
        <p><strong>Customer:</strong> ${(order && order.customer_name) || '—'}</p>
        <p><strong>Phone:</strong> ${(order && order.phone) || '—'}</p>
        <p><strong>Total:</strong> ৳${(order && order.total) ?? '—'}</p>
        <p><strong>Status:</strong> ${(order && order.status) || 'payment_pending'}</p>
        <p><a href="${link}">Open in Admin Dashboard</a></p>
      `
    } else {
      subject = `Payment Proof Submitted — Order #${orderNumber}`
      html = `
        <h2>Payment Proof Submitted</h2>
        <p><strong>Order:</strong> ${orderNumber}</p>
        <p><strong>Customer:</strong> ${(order && order.customer_name) || '—'}</p>
        <p><strong>Amount:</strong> ৳${payload.payment_amount ?? (order && order.advance_amount) ?? '—'}</p>
        <p><strong>Method:</strong> ${payload.payment_method || '—'}</p>
        <p><strong>Transaction:</strong> ${payload.transaction_id || '—'}</p>
        <p><a href="${link}">Review Payment</a></p>
      `
    }

    const from = Deno.env.get('RESEND_FROM') || 'Chumki <onboarding@resend.dev>'
    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [toEmail],
        subject,
        html,
      }),
    })

    const emailJson = await emailRes.json()
    if (!emailRes.ok) {
      return new Response(JSON.stringify({ ok: false, error: emailJson }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ ok: true, id: emailJson.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
