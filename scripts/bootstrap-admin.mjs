import { createClient } from "@supabase/supabase-js";

const email = process.argv[2]?.trim().toLowerCase();
const url = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!email || !url || !serviceRoleKey) {
  console.error(
    "Usage: SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npm run admin:bootstrap -- owner@example.com",
  );
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data: users, error: usersError } = await supabase.auth.admin.listUsers({ perPage: 1000 });
if (usersError) {
  console.error(`Could not list users: ${usersError.message}`);
  process.exit(1);
}

const user = users.users.find((candidate) => candidate.email?.toLowerCase() === email);
if (!user) {
  console.error(
    `No Supabase Auth user exists for ${email}. Create the account first, then rerun this command.`,
  );
  process.exit(1);
}

const { error: roleError } = await supabase
  .from("user_roles")
  .upsert({ user_id: user.id, role: "admin" }, { onConflict: "user_id,role" });
if (roleError) {
  console.error(`Could not grant admin access: ${roleError.message}`);
  process.exit(1);
}

const { error: profileError } = await supabase
  .from("profiles")
  .upsert(
    { user_id: user.id, name: user.email ?? email, role: "admin" },
    { onConflict: "user_id" },
  );
if (profileError) {
  console.error(
    `Admin role was granted, but the profile could not be updated: ${profileError.message}`,
  );
  process.exit(1);
}

console.log(`Admin access granted to ${email}.`);
