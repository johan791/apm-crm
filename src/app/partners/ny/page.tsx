import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PartnerForm } from "@/components/partners/partner-form";
import { createPartner } from "@/lib/actions/partners";

export default function NyPartnerPage() {
  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" render={<Link href="/partners" />}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Tillbaka till partners
      </Button>
      <PartnerForm action={createPartner} />
    </div>
  );
}
