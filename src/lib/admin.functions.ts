import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

function emailFromClaims(claims: any): string | null {
  return typeof claims?.email === "string" ? claims.email : null;
}

/** Retorna se o usuário autenticado é o administrador do sistema. */
export const getAdminStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { isAdminEmail } = await import("./system-settings.server");
    return { isAdmin: await isAdminEmail(emailFromClaims(context.claims)) };
  });

/** Carrega as configurações globais (sem devolver o Secret em texto puro). */
export const getAdminSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { isAdminEmail, getSystemSettings } = await import("./system-settings.server");
    if (!(await isAdminEmail(emailFromClaims(context.claims)))) {
      return { ok: false as const, error: "Acesso restrito ao administrador do sistema." };
    }
    const settings = await getSystemSettings();
    return {
      ok: true as const,
      settings: {
        saas_provider: settings?.saas_provider ?? "mysticpay",
        mysticpay_client_id: settings?.mysticpay_client_id ?? "",
        has_secret: Boolean(settings?.mysticpay_client_secret),
        admin_email: settings?.admin_email ?? "",
      },
    };
  });

/** Salva as credenciais da MisticPay (Client ID / Client Secret). */
export const saveAdminSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { mysticpay_client_id?: string; mysticpay_client_secret?: string }) => input)
  .handler(async ({ data, context }) => {
    const { isAdminEmail } = await import("./system-settings.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (!(await isAdminEmail(emailFromClaims(context.claims)))) {
      return { ok: false as const, error: "Acesso restrito ao administrador do sistema." };
    }
    const payload: Record<string, unknown> = { id: "global", saas_provider: "mysticpay" };
    if (typeof data.mysticpay_client_id === "string") payload.mysticpay_client_id = data.mysticpay_client_id.trim();
    // Só sobrescreve o Secret quando um novo valor é enviado (mantém o atual se vier vazio).
    if (typeof data.mysticpay_client_secret === "string" && data.mysticpay_client_secret.trim()) {
      payload.mysticpay_client_secret = data.mysticpay_client_secret.trim();
    }
    const { error } = await (supabaseAdmin as any).from("system_settings").upsert(payload, { onConflict: "id" });
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

/** Testa as credenciais da MisticPay informadas na tela de Administração. */
export const testMysticPayConnection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { clientId: string; clientSecret: string }) => input)
  .handler(async ({ data, context }) => {
    const { isAdminEmail } = await import("./system-settings.server");
    if (!(await isAdminEmail(emailFromClaims(context.claims)))) {
      return { ok: false as const, error: "Acesso restrito ao administrador do sistema." };
    }
    const { checkMysticPayCredentials } = await import("./mysticpay.server");
    return await checkMysticPayCredentials(data.clientId, data.clientSecret);
  });
