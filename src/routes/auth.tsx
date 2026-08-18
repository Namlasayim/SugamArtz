import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useSession } from "@/lib/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Studio Sign In — Artist Admin" },
      { name: "description", content: "Private sign-in for the artist's studio dashboard." },
      { property: "og:title", content: "Studio Sign In" },
      { property: "og:description", content: "Private sign-in for the artist's studio dashboard." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { session } = useSession();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (session) void navigate({ to: "/admin" as string });
  }, [session, navigate]);

  async function signIn(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: String(data.get("email") ?? ""),
      password: String(data.get("password") ?? ""),
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    void navigate({ to: "/admin" as string });
  }

  async function signUp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email: String(data.get("email") ?? ""),
      password: String(data.get("password") ?? ""),
      options: { emailRedirectTo: `${window.location.origin}/admin` },
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Account created. You can sign in now.");
  }

  async function google() {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Google sign-in failed.");
      return;
    }
    if (result.redirected) return;
    void navigate({ to: "/admin" as string });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-5 py-16">
      <div className="w-full max-w-md border border-border bg-background p-8 sm:p-10">
        <p className="eyebrow">Studio</p>
        <h1 className="mt-3 font-display text-3xl">Artist sign in</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This area is private. Customers do not need an account.
        </p>

        <Tabs defaultValue="signin" className="mt-8">
          <TabsList className="grid w-full grid-cols-2 rounded-none">
            <TabsTrigger value="signin">Sign in</TabsTrigger>
            <TabsTrigger value="signup">Create account</TabsTrigger>
          </TabsList>

          <TabsContent value="signin">
            <form onSubmit={signIn} className="mt-6 space-y-4">
              <Field name="email" label="Email" type="email" />
              <Field name="password" label="Password" type="password" />
              <Button type="submit" disabled={busy} className="w-full rounded-none tracking-[0.12em] uppercase">
                {busy ? "Signing in…" : "Sign in"}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="signup">
            <form onSubmit={signUp} className="mt-6 space-y-4">
              <Field name="email" label="Email" type="email" />
              <Field name="password" label="Password (min 8 characters)" type="password" minLength={8} />
              <Button type="submit" disabled={busy} className="w-full rounded-none tracking-[0.12em] uppercase">
                {busy ? "Creating…" : "Create account"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        <div className="my-6 flex items-center gap-4 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
        </div>
        <Button
          variant="outline"
          onClick={google}
          className="w-full rounded-none border-foreground/25 tracking-[0.12em] uppercase"
        >
          Continue with Google
        </Button>
      </div>
    </div>
  );
}

function Field({
  name,
  label,
  type,
  minLength,
}: {
  name: string;
  label: string;
  type: string;
  minLength?: number;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={`${type}-${name}`} className="eyebrow">
        {label}
      </Label>
      <Input
        id={`${type}-${name}`}
        name={name}
        type={type}
        required
        minLength={minLength}
        className="rounded-none"
      />
    </div>
  );
}