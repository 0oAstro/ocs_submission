import { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import { Database } from "./database.types";

if (
  !process.env.SUPABASE_URL ||
  !process.env.SUPABASE_SERVICE_ROLE_KEY ||
  !process.env.SECRET_KEY
) {
  throw new Error("Missing required environment variables");
}

const supabase = createClient<Database>(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function sanitizeInput(input: string): string {
  return input.replace(/[^a-zA-Z0-9_-]/g, "").trim();
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Verify secret key
  const apiKey = req.headers["x-api-key"];
  if (apiKey !== process.env.SECRET_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { userId, passwordHash } = req.body;

  if (!userId || !passwordHash) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  // Sanitize userId
  const sanitizedUserId = sanitizeInput(userId);
  if (sanitizedUserId.length < 3 || sanitizedUserId.length > 32) {
    return res.status(400).json({ error: "Invalid userId format" });
  }

  try {
    // First verify the user credentials
    const { data: user, error: authError } = await supabase
      .from("users")
      .select("userid, role, password_hash")
      .eq("userid", sanitizedUserId)
      .single();

    if (authError || !user) {
      return res.status(401).json({ error: "Authentication failed" });
    }

    if (user.password_hash !== passwordHash) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // If admin, fetch all users, otherwise just the current user
    let query = supabase.from("users").select("userid, role");
    if (user.role !== "admin") {
      query = query.eq("userid", sanitizedUserId);
    }

    const { data: resultData, error: dataError } = await query;

    if (dataError) {
      return res.status(500).json({ error: "Error fetching data" });
    }

    return res.status(200).json({ data: resultData });
  } catch (error) {
    console.error("[Auth] Server error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
