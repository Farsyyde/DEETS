import { createClient } from "@/lib/supabase/client";
import type { ActivityAction } from "@/types/database";

export async function logActivity(
  projectId: string,
  action: ActivityAction,
  details: Record<string, unknown>
): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  await supabase.from("activity_log").insert({
    project_id: projectId,
    actor_id: user?.id,
    action,
    details,
  });
}
