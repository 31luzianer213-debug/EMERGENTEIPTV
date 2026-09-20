import { supabaseAdmin } from "@/integrations/supabase/client.server";

const DEFAULT_ADMIN_EMAIL = (process.env["ADMIN_EMAIL"]?.trim() || "frfrfrfrfr@gmail.com").toLowerCase();

export type SystemSettings = {
  saas_provider: string;
  mysticpay_client_id: string | null;
  mysticpay_client_secret: string | null;
  admin_email: string | null;
};

export async function getSystemSettings(): Promise<SystemSettings | null> {
  const { data } = await (supabaseAdmin as any)
    .from("system_settings")
    .select("saas_provider, mysticpay_client_id, mysticpay_client_secret, admin_email")
    .eq("id", "global")
    .maybeSingle();
  return (data as SystemSettings) ?? null;
}

export async function getMysticPayCredentials(): Promise<{ clientId: string; clientSecret: string } | null> {
  const settings = await getSystemSettings();
  const clientId = settings?.mysticpay_client_id?.trim();
  const clientSecret = settings?.mysticpay_client_secret?.trim();
  if (clientId && clientSecret) return { clientId, clientSecret };
  return null;
}

export async function getAdminEmail(): Promise<string> {
  const settings = await getSystemSettings();
  return (settings?.admin_email?.trim() || DEFAULT_ADMIN_EMAIL).toLowerCase();
}

export async function isAdminEmail(email: string | null | undefined): Promise<boolean> {
  if (!email) return false;
  return email.trim().toLowerCase() === (await getAdminEmail());
}
