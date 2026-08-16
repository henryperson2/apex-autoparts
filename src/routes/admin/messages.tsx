import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import {
  AdminCard,
  AreaField,
  ConfirmDelete,
  PanelHeader,
  SaveButton,
  SelectField,
  ToggleField,
  useAdminList,
  useAdminMutations,
} from "@/components/admin/admin-kit";
import { AdminShell } from "@/components/admin/admin-shell";
import { MESSAGE_STATUSES } from "@/lib/cms";

export const Route = createFileRoute("/admin/messages")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Messages | Apex Admin" },
      { name: "description", content: "Read contact form enquiries and manage newsletter subscribers." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Messages | Apex Admin" },
      { property: "og:description", content: "Customer enquiries and subscribers." },
    ],
  }),
  component: () => (
    <AdminShell>
      <Panel />
    </AdminShell>
  ),
});

type Message = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  status: string;
  admin_notes: string | null;
  created_at: string;
};

type Subscriber = {
  id: string;
  email: string;
  name: string | null;
  is_active: boolean;
  created_at: string;
};

function Panel() {
  const messages = useAdminList<Message>("contact_messages", { orderBy: "created_at", ascending: false });
  const messageMutations = useAdminMutations("contact_messages");
  const subscribers = useAdminList<Subscriber>("newsletter_subscribers", {
    orderBy: "created_at",
    ascending: false,
  });
  const subscriberMutations = useAdminMutations("newsletter_subscribers");

  return (
    <>
      <PanelHeader title="Messages & subscribers" description="Everything customers send you." />

      <AdminCard title={`Contact enquiries (${messages.data?.length ?? 0})`}>
        {(messages.data ?? []).length === 0 && (
          <p className="text-sm text-muted-foreground">No enquiries yet.</p>
        )}
        <div className="space-y-4">
          {(messages.data ?? []).map((message) => (
            <MessageRow
              key={message.id}
              message={message}
              pending={messageMutations.update.isPending}
              onSave={(values) => messageMutations.update.mutate({ id: message.id, values })}
              onDelete={() => messageMutations.remove.mutate(message.id)}
            />
          ))}
        </div>
      </AdminCard>

      <AdminCard title={`Newsletter subscribers (${subscribers.data?.length ?? 0})`}>
        {(subscribers.data ?? []).length === 0 && (
          <p className="text-sm text-muted-foreground">No subscribers yet.</p>
        )}
        <div className="space-y-3">
          {(subscribers.data ?? []).map((subscriber) => (
            <div
              key={subscriber.id}
              className="flex flex-wrap items-center gap-3 rounded border border-border p-3"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">{subscriber.email}</p>
                <p className="text-xs text-muted-foreground">
                  {subscriber.name ?? "—"} · joined{" "}
                  {new Date(subscriber.created_at).toISOString().slice(0, 10)}
                </p>
              </div>
              <ToggleField
                label="Active"
                checked={subscriber.is_active}
                onChange={(value) =>
                  subscriberMutations.update.mutate({
                    id: subscriber.id,
                    values: { is_active: value },
                  })
                }
              />
              <ConfirmDelete
                onConfirm={() => subscriberMutations.remove.mutate(subscriber.id)}
                description="This subscriber will be removed from your list."
              />
            </div>
          ))}
        </div>
      </AdminCard>
    </>
  );
}

function MessageRow({
  message,
  onSave,
  onDelete,
  pending,
}: {
  message: Message;
  onSave: (values: Record<string, unknown>) => void;
  onDelete: () => void;
  pending: boolean;
}) {
  const [status, setStatus] = useState(message.status);
  const [notes, setNotes] = useState(message.admin_notes ?? "");

  return (
    <div className="rounded border border-border p-4">
      <p className="text-lg leading-tight">{message.subject || "General enquiry"}</p>
      <p className="text-xs text-muted-foreground">
        {message.name} · {message.email} · {message.phone ?? "no phone"} ·{" "}
        {new Date(message.created_at).toISOString().slice(0, 10)}
      </p>
      <p className="mt-3 whitespace-pre-wrap text-sm">{message.message}</p>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <SelectField
          label="Status"
          value={status}
          onChange={setStatus}
          options={MESSAGE_STATUSES.map((value) => ({ value, label: value }))}
        />
        <AreaField label="Internal notes" value={notes} onChange={setNotes} rows={2} />
      </div>
      <div className="mt-4 flex items-center gap-2">
        <SaveButton
          pending={pending}
          onClick={() => onSave({ status, admin_notes: notes || null })}
        />
        <ConfirmDelete onConfirm={onDelete} description="This enquiry will be deleted." />
      </div>
    </div>
  );
}
