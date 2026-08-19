import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Clock, Loader2, Mail, MapPin, Phone } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact & Fitment Help | Apex Auto Parts" },
      {
        name: "description",
        content:
          "Call, email or visit the Apex Auto Parts counter for fitment checks, bulk pricing and offline payment questions.",
      },
      { property: "og:title", content: "Contact Apex Auto Parts" },
      {
        property: "og:description",
        content: "Fitment help, bulk pricing and store hours.",
      },
    ],
  }),
  component: ContactPage,
});

const contactSchema = z.object({
  name: z.string().trim().min(1, "Please add your name").max(100, "Name is too long"),
  email: z.string().trim().email("Enter a valid email address").max(255),
  phone: z.string().trim().max(40, "Phone is too long").optional(),
  subject: z.string().trim().max(200, "Vehicle details are too long").optional(),
  message: z.string().trim().min(1, "Tell us what you need").max(2000, "Message is too long"),
});

function ContactPage() {
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  const set = (key: keyof typeof form) => (event: { target: { value: string } }) =>
    setForm((prev) => ({ ...prev, [key]: event.target.value }));

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const parsed = contactSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please check the form.");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.from("contact_messages").insert({
        name: parsed.data.name,
        email: parsed.data.email,
        phone: parsed.data.phone || null,
        subject: parsed.data.subject || null,
        message: parsed.data.message,
      });
      if (error) throw error;
      setSent(true);
      setForm({ name: "", email: "", phone: "", subject: "", message: "" });
      toast.success("Message sent — we'll reply within one business day.");
    } catch {
      toast.error("We couldn't send that message. Please try again or call the counter.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <p className="label-stencil text-sm text-brass">Support</p>
      <h1 className="mt-1 text-5xl">Talk to the counter</h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Send your vehicle details and we'll confirm the right part before you order. Trade and fleet
        pricing available on request.
      </p>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_18rem]">
        <form className="space-y-4 rounded-md border border-border bg-card p-6" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" required maxLength={100} value={form.name} onChange={set("name")} className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                maxLength={255}
                value={form.email}
                onChange={set("email")}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone (optional)</Label>
              <Input id="phone" maxLength={40} value={form.phone} onChange={set("phone")} className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="vehicle">Vehicle / VIN</Label>
              <Input
                id="vehicle"
                placeholder="2016 Silverado 1500 5.3L"
                maxLength={200}
                value={form.subject}
                onChange={set("subject")}
                className="mt-1.5"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="message">What do you need?</Label>
            <Textarea
              id="message"
              rows={5}
              required
              maxLength={2000}
              value={form.message}
              onChange={set("message")}
              className="mt-1.5"
            />
          </div>
          <Button type="submit" variant="brass" size="lg" disabled={busy}>
            {busy && <Loader2 className="animate-spin" />}
            {sent ? "Sent — send another" : "Send message"}
          </Button>
        </form>


        <aside className="h-fit space-y-5 rounded-md border border-border bg-card p-6">
          <div className="flex items-start gap-3">
            <Phone className="mt-0.5 h-5 w-5 text-brass" />
            <div>
              <p className="label-stencil text-sm">Call</p>
              <p className="text-sm text-muted-foreground">(555) 018-4420</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Mail className="mt-0.5 h-5 w-5 text-brass" />
            <div>
              <p className="label-stencil text-sm">Email</p>
              <p className="text-sm text-muted-foreground">counter@apexparts.example</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <MapPin className="mt-0.5 h-5 w-5 text-brass" />
            <div>
              <p className="label-stencil text-sm">Counter</p>
              <p className="text-sm text-muted-foreground">
                418 Foundry Road, Bay 3
                <br />
                Ironside, OH
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Clock className="mt-0.5 h-5 w-5 text-brass" />
            <div>
              <p className="label-stencil text-sm">Hours</p>
              <p className="text-sm text-muted-foreground">
                Mon–Fri 7am–7pm
                <br />
                Sat 8am–4pm · Sun closed
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
