import { createFileRoute } from "@tanstack/react-router";

/**
 * Webhook da MisticPay para a assinatura do SISTEMA (conta do dono do Sigma Control).
 * O pagamento nunca é confiado pelo corpo da notificação: reconsultamos a transação
 * na API da MisticPay (via reconcileSaasPayment) antes de ativar a assinatura.
 */
export const Route = createFileRoute("/api/public/hooks/saas-mysticpay")({
  server: {
    handlers: {
      GET: async () => new Response("SaaS MisticPay Webhook Active", { status: 200 }),
      POST: async ({ request }) => {
        try {
          let body: any = {};
          try { body = await request.json(); } catch {}

          const url = new URL(request.url);
          const providerId =
            body?.transactionId != null ? String(body.transactionId) : url.searchParams.get("transactionId");
          const type = String(body?.transactionType || "DEPOSITO").toUpperCase();

          if (!providerId) return Response.json({ ok: true, message: "Evento sem ID de transação ignorado." });
          if (type !== "DEPOSITO") return Response.json({ ok: true, message: "Evento não é de depósito." });

          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { data: payment } = await (supabaseAdmin as any)
            .from("saas_payments")
            .select("id")
            .eq("provider_payment_id", providerId)
            .eq("provider", "mysticpay")
            .maybeSingle();

          if (!payment) return Response.json({ ok: true, message: "Pagamento não pertence à assinatura do sistema." });

          const { reconcileSaasPayment } = await import("@/lib/subscription.server");
          const result = await reconcileSaasPayment(payment.id);
          return Response.json(result, { status: result.ok ? 200 : 500 });
        } catch (error) {
          console.error("Erro no webhook da assinatura (MisticPay):", error);
          return Response.json({ ok: false, error: error instanceof Error ? error.message : "Erro interno." }, { status: 500 });
        }
      },
    },
  },
});
