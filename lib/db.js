import { supabase } from "./supabaseClient.js";

export async function saveIPOToDB(name, about, financials) {
  const { data, error } = await supabase
    .from("ipo_details")
    .upsert(
      { name, about, financials },
      { onConflict: "name" }
    );

  if (error) {
    console.error("Error saving IPO:", error);
  } else {
    console.log("IPO saved:", data);
  }
}
export async function getIPOFromDB(ipoName) {
  const { data, error } = await supabase
    .from("ipo_details")
    .select("*")
    .eq("name", ipoName)
    .single();

  if (error && error.code !== "PGRST116") { // 116 = no rows found
    console.error("Error fetching IPO:", error);
    return null;
  }
  return data || null;
}