import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCustomRequests, useRefresh } from "@/lib/admin";
import { signedUrls } from "@/lib/storage";
import { formatDate } from "@/lib/format";
import { REQUEST_LABELS, REQUEST_STATUSES, type CustomRequest } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { whatsappLink } from "@/lib/site";

const BUCKET = "custom-request-images";

export const Route = createFileRoute("/_authenticated/admin/requests")({
  component: AdminRequests,
});

function AdminRequests() {
  const { data: requests = [], isLoading } = useCustomRequests();
  const refresh = useRefresh();
  const [images, setImages] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    const paths = requests.flatMap((r) => r.custom_request_images.map((i) => i.storage_path));
    if (paths.length === 0) return;
    void signedUrls(BUCKET, paths)
      .then(setImages)
      .catch(() => toast.error("Reference images could not be loaded."));
  }, [requests]);

  async function setStatus(id: string, status: string) {
    const { error } = await supabase
      .from("custom_requests")
      .update({ status } as never)
      .eq("id", id);
    if (error) {
      toast.error("Could not update the request.");
      return;
    }
    toast.success("Request updated.");
    refresh(["admin-custom"]);
  }

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl">Commission requests</h1>
      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
      <div className="space-y-4">
        {requests.map((r: CustomRequest) => (
          <article key={r.id} className="bg-background p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <div>
                <p className="eyebrow">{formatDate(r.created_at)}</p>
                <h2 className="mt-1 font-display text-xl">{r.name}</h2>
              </div>
              <Select value={r.status} onValueChange={(v) => setStatus(r.id, v)}>
                <SelectTrigger className="w-48 rounded-none" aria-label="Request status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REQUEST_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {REQUEST_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <p className="mt-4 text-sm leading-relaxed whitespace-pre-line text-muted-foreground">
              {r.idea}
            </p>

            <dl className="mt-4 grid gap-2 text-sm text-muted-foreground sm:grid-cols-3">
              <p>Size: {r.preferred_size ?? "—"}</p>
              <p>Budget: {r.budget ?? "—"}</p>
              <p>Needed by: {r.deadline ? formatDate(r.deadline) : "—"}</p>
            </dl>

            {r.custom_request_images.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-3">
                {r.custom_request_images.map((img) => {
                  const url = images.get(img.storage_path) ?? img.image_url;
                  return url ? (
                    <a key={img.id} href={url} target="_blank" rel="noreferrer">
                      <img src={url} alt="Reference" className="h-24 w-24 object-cover" />
                    </a>
                  ) : null;
                })}
              </div>
            )}

            <div className="mt-5 flex flex-wrap gap-2">
              {r.whatsapp && whatsappLink(r.whatsapp) && (
                <Button asChild variant="outline" size="sm" className="rounded-none">
                  <a href={whatsappLink(r.whatsapp)!} target="_blank" rel="noreferrer">
                    Reply on WhatsApp
                  </a>
                </Button>
              )}
              {r.email && (
                <Button asChild variant="outline" size="sm" className="rounded-none">
                  <a href={`mailto:${r.email}`}>Reply by email</a>
                </Button>
              )}
            </div>
          </article>
        ))}
        {!isLoading && requests.length === 0 && (
          <p className="bg-background p-10 text-center text-sm text-muted-foreground">
            No requests yet.
          </p>
        )}
      </div>
    </div>
  );
}
