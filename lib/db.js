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
