import { createClient } from "@supabase/supabase-js";
import { Database } from "./database.types";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

export async function authenticate(userId: string, passwordHash: string) {
  // ...authentication logic...
  const { data: userData, error: authError } = await supabase
    .from("users")
    .select("userid, role, password_hash")
    .eq("userid", userId)
    .single();

  if (authError || !userData) {
    throw new Error("Authentication failed");
  }

  if (userData.password_hash !== passwordHash) {
    throw new Error("Invalid credentials");
  }

  let query = supabase.from("users").select("userid, password_hash, role");
  if (userData.role !== "admin") {
    query = query.eq("userid", userId);
  }
  const { data: resultData, error: dataError } = await query;
  if (dataError) {
    throw new Error("Error fetching data");
  }
  return resultData;
}
