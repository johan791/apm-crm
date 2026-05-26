# APM Project – Projekthub

**Syfte:** Internt CRM/ERP för APM Project, ett företag som säljer cirkulär (återbrukad/renoverad) kontorsinredning i Göteborg. Systemet hanterar kunder, projekt, tidrapportering, offerter och leveransplanering. Det kompletterar Fortnox (fakturering) och Office 365 (mail/kalender) — det ersätter dem inte.

**Stack:** Next.js 16, TypeScript, Tailwind CSS, Prisma 6, shadcn/ui v4, PostgreSQL (Neon Frankfurt), Vercel-hosting.

**URL:** https://apm-crm-one.vercel.app/

---

## Layout

**Desktop:** Fast sidebar (240px) till vänster + huvudinnehåll till höger. Sidebaren har:
- Logotyp-block högst upp ("A"-ikon + "APM Project / Projekthub")
- Navigering grupperad i sektioner:
  - *(ingen rubrik)* — Dashboard
  - **Hantera** — Kunder, Projekt
  - **Ekonomi** — Offerter, Tidrapportering
  - **Planera** — Leveransplanering
- Footer med avatar-placeholder (APM Project / admin@apmproject.se)
- Aktiv sida markeras med vänsterkant-linje + primärfärg

**Mobil:** Sidebaren döljs, ersätts av hamburger-meny (Sheet/drawer från vänster). Topbar med "APM Project"-text.

**Print:** Sidebar och mobilnav döljs med `@media print`. Padding nollställs. Offerter har en dedikerad print-sida optimerad för A4.

---

## Moduler och dataflöde

### 1. Dashboard (`/`)
- 6 KPI-kort: Antal kunder, antal projekt, aktiva projekt, timmar denna månad, aktiva offerter (ej utkast), leveranser denna vecka
- Snabbknappar: "Ny kund", "Nytt projekt"
- Lista: Senast uppdaterade projekt med statusbadge (Aktiv/Klar/Avbruten)

### 2. Kunder (`/kunder`)
- **Lista:** Alla kunder, sökbar på företagsnamn/kontaktperson/ort. Visar företagsnamn, kontaktperson, ort, antal projekt.
- **Detalj** (`/kunder/[id]`): Alla kunduppgifter + lista med kundens projekt
- **Skapa/redigera** (`/kunder/ny`, `/kunder/[id]/redigera`): Formulär med företagsnamn, org.nr, kontaktperson, e-post, telefon, adress, stad, postnr, anteckningar
- **Ta bort:** Bekräftelsedialog

**Fält:** companyName, orgNumber, contactPerson, email, phone, address, city, zipCode, notes

### 3. Projekt (`/projekt`)
- **Lista:** Alla projekt med status-badge, kundnamn, period. Sökbar.
- **Detalj** (`/projekt/[id]`): Projektinfo (beskrivning, kund, timpris, period) + statusväljare (active/paused/completed/cancelled) + **Tidrapportering-sektion** (summering av timmar/belopp/poster, senaste 5 poster, länk till alla)
- **Skapa/redigera** (`/projekt/nytt`, `/projekt/[id]/redigera`): Namn, beskrivning, kund (dropdown), timpris, start/slutdatum, status
- **Ta bort:** Bekräftelsedialog, cascaderar tidposter

**Fält:** name, description, status, hourlyRate, startDate, endDate, customerId

**Relationer:** Kund → Projekt (1:N). Ett projekt tillhör alltid en kund.

### 4. Tidrapportering (`/tidrapportering`)
- **Övergripande lista:** Alla tidposter med summering av totala timmar. Sökbar på projekt/kund/beskrivning. Tabellvy: datum, projekt, kund, timmar, beskrivning.
- **Per projekt** (`/projekt/[id]/tid`): Tidposter filtrerade på ett projekt. Visar summering (timmar, belopp om timpris finns, antal poster).
- **Skapa** (`/tidrapportering/ny` eller `/projekt/[id]/tid/ny`): Projekt (dropdown), datum, timmar (steg 0.25), beskrivning
- **Redigera/ta bort** (`/projekt/[id]/tid/[entryId]/redigera`)

**Fält:** projectId, date, hours (Decimal), description

**Relationer:** Projekt → TimeEntry (1:N, cascade delete). Timposter aggregeras på dashboarden (timmar denna månad) och på projektdetaljsidan.

### 5. Offerter & Order (`/offerter`)
- **Lista:** Alla offerter med statusfilter-knappar (Alla/Utkast/Skickad/Accepterad/Avvisad/Order). Sökbar på kund eller offertnummer. Visar offertnr, kund, projekt, status-badge, summa ex. moms, datum.
- **Detalj** (`/offerter/[id]`): Header med statusväljare (dropdown). Kunduppgifter och villkor i kort. Offertrader-tabell med beskrivning, enhet, antal, á-pris, rabatt, radsumma. Footer: summa ex. moms, moms 25%, totalt inkl. moms. **Intern marginalkalkyl** (orange kort): kostnad, försäljning, marginal i kr och %.
- **Skapa** (`/offerter/ny`): Formulär för kund, projekt (valfritt), giltighetsdatum, betalningsvillkor, leveransvillkor, anteckningar. Offertnummer genereras automatiskt (startar från 1001).
- **Redigera** (`/offerter/[id]/redigera`): Offerthuvud + **radeditor** — dynamisk tabell med useState där man lägger till/tar bort rader. Varje rad: beskrivning, enhet (st/tim/m/m²/paket), antal, á-pris, kostnadspris (internt), rabatt%. Beräknade värden: radsumma, totaler, marginal. Sparas som JSON → server action → databastransaktion.
- **Print-vy** (`/offerter/[id]/skriv-ut`): A4-optimerad layout med APM Project-branding. Kundadress, offertrader (utan kostnadspris/marginal), totaler, villkor. Knapp "Skriv ut" anropar window.print().
- **Statusflöde:** draft → sent → accepted → rejected, eller accepted → order (konvertera till order-knapp)

**Fält (Quote):** quoteNumber (auto), status, customerId, projectId?, validUntil, deliveryTerms, paymentTerms, notes
**Fält (QuoteItem):** description, unit, quantity, unitPrice, costPrice, discount, sortOrder

**Relationer:** Kund → Offert (1:N), Projekt → Offert (1:N, valfritt). Offert → Rader (1:N, cascade delete).

### 6. Leveransplanering (`/leveransplanering`)
- **Kalendervy:** CSS grid med 8 kolumner (veckonummer + mån–sön). Svenska dagnamn. Veckonummer (ISO) till vänster. Dagens datum markerat med ring. Helger med dämpad bakgrund. Dagar utanför månaden tonade.
- **Händelser som färgade pills:** Blå = leverans, Grön = installation, Gul = upphämtning. Klickbara → redigera.
- **Navigation:** Föregående/nästa månad-knappar + "Idag"-knapp.
- **Kommande händelser:** Kort under kalendern med händelser de närmaste 7 dagarna.
- **Skapa** (`/leveransplanering/ny`): Typ (leverans/installation/upphämtning), datum, tid, projekt (auto-fyller kund), kund, adress, anteckningar.
- **Redigera/ta bort** (`/leveransplanering/[id]/redigera`)

**Fält:** type, date, time, projectId, customerId, address, notes, reminderSent (ej implementerat än)

**Relationer:** Projekt → DeliveryEvent (1:N), Kund → DeliveryEvent (1:N). Antal denna vecka visas på dashboarden.

---

## Hur modulerna hänger ihop

```
Kund
 ├── Projekt (1:N)
 │    ├── TimeEntry (1:N, cascade)
 │    ├── Quote (1:N, valfritt)
 │    └── DeliveryEvent (1:N)
 ├── Quote (1:N)
 │    └── QuoteItem (1:N, cascade)
 └── DeliveryEvent (1:N)
```

- En **kund** är navet — allt kopplas till en kund
- Ett **projekt** samlar arbete: tidposter, offerter, leveranser
- **Offerter** kan kopplas till ett projekt men behöver inte (t.ex. vid initiala offertförfrågningar)
- **Leveranshändelser** kopplas till både projekt och kund (adressen kan vara annan än kundens)
- **Dashboarden** aggregerar data från alla moduler

---

## Vad som INTE finns (ännu)

- **Autentisering/inloggning** — ingen login, öppen åtkomst
- **Användare/roller** — en User-modell finns i schemat men används inte
- **Fortnox-integration** — ingen koppling till fakturering
- **Office 365-integration** — ingen kalender-/mailsynk
- **Påminnelser** — fältet `reminderSent` finns men ingen logik
- **Filuppladdningar** — inga dokument/bilder
- **Aktivitetslogg/historik** — ingen audit trail
- **Flera valutor** — allt i SEK
- **Rapporter/export** — ingen sammanställning eller Excel-export
