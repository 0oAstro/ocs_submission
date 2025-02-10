// REMINDER: The error "infinite recursion detected in policy for relation 'users'"
// indicates a misconfigured RLS policy in Supabase. Please update the users table policies
// in your Supabase dashboard to ensure they don't reference the users table recursively.
// Alternatively, if using a service role is acceptable in your context, initialize your Supabase
// client with the service key instead of the anon key (and ensure policies are adjusted accordingly).

import { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

import { Database } from "./database.types";

// Initialize Supabase client (using anon key; consider switching to SERVICE_ROLE_KEY if safe)
// Use service role key to bypass RLS on secure server endpoints
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log("[Auth] Received request:", {
    method: req.method,
    body: req.body,
  });

  if (req.method !== "POST") {
    console.log("[Auth] Method not allowed:", req.method);
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { userId, passwordHash } = req.body;

  if (!userId || !passwordHash) {
    console.log("[Auth] Missing fields:", {
      userId: !!userId,
      passwordHash: !!passwordHash,
    });
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    console.log("[Auth] Attempting to authenticate user:", userId);
    const { data: userData, error: authError } = await supabase
      .from("users")
      .select("userid, role, password_hash")
      .eq("userid", userId)
      .single();

    if (authError || !userData) {
      console.log("[Auth] Authentication failed:", { error: authError });
      return res.status(401).json({ error: "Authentication failed" });
    }

    console.log("[Auth] User found:", {
      userId: userData.userid,
      role: userData.role,
    });

    if (userData.password_hash !== passwordHash) {
      console.log("[Auth] Invalid password for user:", userId);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    console.log("[Auth] Password verified, fetching user data");
    let query = supabase.from("users").select("userid, role");
    if (userData.role !== "admin") {
      console.log("[Auth] Non-admin user, restricting query");
      query = query.eq("userid", userId);
    }
    const { data: resultData, error: dataError } = await query;

    if (dataError) {
      console.log("[Auth] Error fetching user data:", dataError);
      return res.status(500).json({ error: "Error fetching data" });
    }

    console.log("[Auth] Successfully retrieved data:", {
      count: resultData?.length,
    });
    return res.status(200).json({ data: resultData });
  } catch (error) {
    console.error("[Auth] Server error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
