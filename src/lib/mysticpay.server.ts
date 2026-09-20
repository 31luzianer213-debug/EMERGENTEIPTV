/**
 * Integração com a MisticPay (Pix Cash-In) para a assinatura do SISTEMA.
 * Docs: https://docs.misticpay.com  (POST /api/transactions/create e /api/transactions/check)
 *
 * Autenticação:
 *  - Chave de acesso pk_/sk_  -> header Authorization: Basic base64(clientId:clientSecret)
 *  - Credencial legada ci/cs  -> headers ci / cs (funciona em create e check)
 * Detectamos o formato pela prefixo do Client ID.
 */

const MISTICPAY_BASE = "https://api.misticpay.com/api";

function authHeaders(clientId: string, clientSecret: string): Record<string, string> {
  const id = clientId.trim();
  const secret = clientSecret.trim();
  if (id.startsWith("pk_") || id.startsWith("sk_")) {
    const basic = Buffer.from(`${id}:${secret}`).toString("base64");
    return { Authorization: `Basic ${basic}` };
  }
  return { ci: id, cs: secret };
}

/** Gera um CPF válido (dígitos verificadores corretos) para o campo obrigatório do pagador. */
function generateValidCpf(): string {
  const n = Array.from({ length: 9 }, () => Math.floor(Math.random() * 9));
  const calc = (base: number[]) => {
    const sum = base.reduce((acc, digit, i) => acc + digit * (base.length + 1 - i), 0);
    const rest = (sum * 10) % 11;
    return rest === 10 ? 0 : rest;
  };
  const d1 = calc(n);
  const d2 = calc([...n, d1]);
  return [...n, d1, d2].join("");
}

export interface CreateMysticPayPixInput {
  clientId: string;
  clientSecret: string;
  amount: number;
  description: string;
  transactionId: string;
  payerName: string;
  payerDocument?: string;
  webhookUrl?: string;
}

export interface CreateMysticPayPixResult {
  ok: boolean;
  transactionId?: string;
  status?: string;
  qrCode?: string | null; // Pix copia e cola (copyPaste)
  qrCodeBase64?: string | null; // base64 puro (sem prefixo data:)
  error?: string;
}

export async function createMysticPayPixPayment(
  input: CreateMysticPayPixInput,
): Promise<CreateMysticPayPixResult> {
  if (!input.clientId?.trim() || !input.clientSecret?.trim()) {
    return { ok: false, error: "Credenciais da MisticPay não configuradas." };
  }

  const payload = {
    amount: Number(Number(input.amount).toFixed(2)),
    payerName: (input.payerName || "Cliente").slice(0, 120),
    payerDocument: (input.payerDocument || generateValidCpf()).replace(/\D/g, ""),
    transactionId: input.transactionId,
    description: input.description.slice(0, 140),
    ...(input.webhookUrl ? { projectWebhook: input.webhookUrl } : {}),
  };

  try {
    const res = await fetch(`${MISTICPAY_BASE}/transactions/create`, {
      method: "POST",
      headers: { ...authHeaders(input.clientId, input.clientSecret), "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data: any = await res.json().catch(() => ({}));

    if (!res.ok) {
      const errMsg = data?.message || data?.error || "Erro ao gerar o Pix na MisticPay.";
      return { ok: false, error: errMsg };
    }

    const d = data?.data ?? {};
    const qrCodeBase64 = String(d.qrCodeBase64 || "").replace(/^data:image\/\w+;base64,/, "");
    return {
      ok: true,
      transactionId: String(d.transactionId ?? ""),
      status: d.transactionState,
      qrCode: d.copyPaste ?? null,
      qrCodeBase64: qrCodeBase64 || null,
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Falha na conexão com a MisticPay." };
  }
}

export interface CheckMysticPayInput {
  clientId: string;
  clientSecret: string;
  transactionId: string;
}

export async function checkMysticPayPayment(
  input: CheckMysticPayInput,
): Promise<{ ok: boolean; state?: string; error?: string }> {
  try {
    const res = await fetch(`${MISTICPAY_BASE}/transactions/check`, {
      method: "POST",
      headers: { ...authHeaders(input.clientId, input.clientSecret), "Content-Type": "application/json" },
      body: JSON.stringify({ transactionId: input.transactionId }),
    });
    const data: any = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: data?.message || "Falha ao consultar a transação." };
    const state = String(data?.transaction?.transactionState || "PENDENTE").toUpperCase();
    return { ok: true, state };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Falha na conexão com a MisticPay." };
  }
}

/** Valida as credenciais tentando autenticar na rota de consulta (sem depender de uma transação real). */
export async function checkMysticPayCredentials(
  clientId: string,
  clientSecret: string,
): Promise<{ ok: boolean; message?: string; error?: string }> {
  if (!clientId?.trim() || !clientSecret?.trim()) {
    return { ok: false, error: "Informe o Client ID e o Client Secret." };
  }
  try {
    const res = await fetch(`${MISTICPAY_BASE}/transactions/check`, {
      method: "POST",
      headers: { ...authHeaders(clientId, clientSecret), "Content-Type": "application/json" },
      body: JSON.stringify({ transactionId: "0" }),
    });
    if (res.status === 401 || res.status === 403) {
      return { ok: false, error: "Credenciais recusadas pela MisticPay. Verifique o Client ID e o Secret." };
    }
    // 400 (id inválido) / 404 (não encontrada) / 200 => autenticação passou.
    return { ok: true, message: "Credenciais válidas na MisticPay." };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Falha na conexão com a MisticPay." };
  }
}
