"use client";

import { FileDown, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Två knappar mot samma utskriftsdialog. Webbläsaren har ingen separat
 * "spara som PDF"-funktion — PDF:en skapas genom att välja Microsoft Print
 * to PDF eller Spara som PDF som skrivare. Den egna knappen finns för att
 * APM ska hitta vägen dit; de skriver ut offerten till PDF som internt
 * underlag och skickar den skarpa offerten från Fortnox.
 */
export function PrintButton() {
  return (
    <div className="flex gap-2">
      <Button size="sm" onClick={() => window.print()}>
        <FileDown className="mr-2 h-4 w-4" />
        Spara som PDF
      </Button>
      <Button variant="outline" size="sm" onClick={() => window.print()}>
        <Printer className="mr-2 h-4 w-4" />
        Skriv ut
      </Button>
    </div>
  );
}
