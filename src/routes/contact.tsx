import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

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

function ContactPage() {
  const [sent, setSent] = useState(false);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <p className="label-stencil text-sm text-brass">Support</p>
      <h1 className="mt-1 text-5xl">Talk to the counter</h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Send your vehicle details and we'll confirm the right part before you order. Trade and fleet
        pricing available on request.
      </p>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_18rem]">
        <form
          className="space-y-4 rounded-md border border-border bg-card p-6"
          onSubmit={(event) => {
            event.preventDefault();
            setSent(true);
            toast.success("Message logged — we'll reply within one business day.");
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" required className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required className="mt-1.5" />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="vehicle">Vehicle / VIN</Label>
              <Input id="vehicle" placeholder="2016 Silverado 1500 5.3L" className="mt-1.5" />
            </div>
          </div>
          <div>
            <Label htmlFor="message">What do you need?</Label>
            <Textarea id="message" rows={5} required className="mt-1.5" />
          </div>
          <Button type="submit" variant="brass" size="lg">
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
