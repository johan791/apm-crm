"use client";

import { useState, useTransition } from "react";
import { Mail, Phone, Plus, Pencil, Trash2, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createContact, updateContact, deleteContact } from "@/lib/actions/contacts";

interface Contact {
  id: string;
  name: string;
  role: string | null;
  email: string | null;
  phone: string | null;
}

interface ContactListProps {
  customerId: string;
  contacts: Contact[];
}

function ContactForm({
  customerId,
  contact,
  onDone,
}: {
  customerId: string;
  contact?: Contact;
  onDone: () => void;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="space-y-3 rounded-md border p-3 bg-muted/30"
      action={(formData) => {
        startTransition(async () => {
          if (contact) {
            await updateContact(contact.id, customerId, formData);
          } else {
            await createContact(customerId, formData);
          }
          onDone();
        });
      }}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="contact-name" className="text-xs">Namn *</Label>
          <Input
            id="contact-name"
            name="name"
            required
            defaultValue={contact?.name ?? ""}
            placeholder="Anna Andersson"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="contact-role" className="text-xs">Roll</Label>
          <Input
            id="contact-role"
            name="role"
            defaultValue={contact?.role ?? ""}
            placeholder="Inköpare, Projektledare..."
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="contact-email" className="text-xs">E-post</Label>
          <Input
            id="contact-email"
            name="email"
            type="email"
            defaultValue={contact?.email ?? ""}
            placeholder="anna@example.se"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="contact-phone" className="text-xs">Telefon</Label>
          <Input
            id="contact-phone"
            name="phone"
            defaultValue={contact?.phone ?? ""}
            placeholder="070-123 45 67"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={isPending}>
          <Check className="mr-1 h-3.5 w-3.5" />
          {contact ? "Spara" : "Lägg till"}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onDone}>
          <X className="mr-1 h-3.5 w-3.5" />
          Avbryt
        </Button>
      </div>
    </form>
  );
}

export function ContactList({ customerId, contacts }: ContactListProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-3">
      {contacts.map((contact) =>
        editingId === contact.id ? (
          <ContactForm
            key={contact.id}
            customerId={customerId}
            contact={contact}
            onDone={() => setEditingId(null)}
          />
        ) : (
          <div
            key={contact.id}
            className="flex items-start justify-between rounded-md border p-3"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{contact.name}</span>
                {contact.role && (
                  <span className="text-xs text-muted-foreground">
                    {contact.role}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                {contact.email && (
                  <a
                    href={`mailto:${contact.email}`}
                    className="flex items-center gap-1 hover:underline"
                  >
                    <Mail className="h-3.5 w-3.5" />
                    {contact.email}
                  </a>
                )}
                {contact.phone && (
                  <a
                    href={`tel:${contact.phone}`}
                    className="flex items-center gap-1 hover:underline"
                  >
                    <Phone className="h-3.5 w-3.5" />
                    {contact.phone}
                  </a>
                )}
              </div>
            </div>
            <div className="flex gap-1 shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingId(contact.id)}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={isPending}
                onClick={() =>
                  startTransition(() =>
                    deleteContact(contact.id, customerId)
                  )
                }
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )
      )}

      {contacts.length === 0 && !showForm && (
        <p className="text-sm text-muted-foreground">
          Inga kontaktpersoner tillagda.
        </p>
      )}

      {showForm ? (
        <ContactForm
          customerId={customerId}
          onDone={() => setShowForm(false)}
        />
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowForm(true)}
        >
          <Plus className="mr-1 h-3.5 w-3.5" />
          Lägg till kontakt
        </Button>
      )}
    </div>
  );
}
