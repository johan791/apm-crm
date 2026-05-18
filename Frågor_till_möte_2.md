# Frågor till möte 2 med APM Project

## Beslutade punkter (från möte 1 + Johans analys)
- **Teknik:** Next.js + TypeScript + Tailwind + Neon PostgreSQL + Vercel (Lovable skrotas)
- **Mobil:** Lika viktigt som desktop – teamet jobbar mycket ute hos kunder
- **Filosofi:** Projekthub som kompletterar Fortnox + Office 365, inte ersätter dem
- **Fokus:** Lösa att det är svårt att sätta sig in i varandras projekt

## Frågor att ställa till Linda/teamet

### Underleverantörer
- Ska snickarna/ommöblerarna ha någon tillgång till systemet?
  - T.ex. se sina uppdrag, leveransdatum, ladda upp bilder på färdigt arbete?
  - Eller sköts all kommunikation via mejl/telefon som idag?
  - Alternativ: Designa så det går att lägga till senare utan ombyggnad

### Tidsram och leveransmodell
- Vill ni ha en körbar MVP inom 1 vecka (kunder + projekt + basic vy)?
- Eller en mer genomarbetad leverans modul för modul över 2-3 veckor?
- Finns det en deadline (t.ex. inför ett visst projekt eller kvartalsskifte)?

### Arbetsflöde – Prioritering
- Vilken modul ger mest smärtlindring först?
  - Projektöversikten ("vem gör vad just nu")?
  - Offertbyggaren (slippa Excel-marginalberäkning)?
  - Tidrapporteringen?
- Vad tar mest tid idag som ni önskar gick snabbare?

### Bilder och filer
- Hur hanterar ni foton idag? iPhone → OneDrive direkt?
- Vill ni att systemet lagrar bilder, eller räcker det att länka till OneDrive?
- Behöver ni bildgallerier att visa kunder (t.ex. "före/efter")?

### Fortnox-integration
- Vilken Fortnox-plan har ni? (påverkar API-tillgång)
- Vad vill ni synka? Enbart leverantörsfakturor, eller även kunder/artiklar?
- Hanterar ni fakturering helt i Fortnox, eller behöver systemet skapa fakturor?

### Office 365 / OneDrive
- Hur är era filer organiserade idag? (mappstruktur per kund/projekt?)
- Vill ni att systemet visar/länkar OneDrive-filer direkt i projektvyn?
- Ska leveransplanering synka med era Outlook-kalendrar?

### Användarroller och åtkomst
- Ska alla tre (Linda, Caroline, Robert) ha samma behörighet?
- Finns det information som bara VD ska se (t.ex. marginaler, ekonomi)?
- Kommer fler anställda tillkomma inom överskådlig framtid?

### Hållbarhetsdata
- Ni rapporterar CO2-besparing och kostnadsbesparing per projekt på hemsidan
- Ska systemet beräkna/spåra detta, eller görs det separat idag?
- Är CSRD-rapportering aktuellt för era kunders skull?

## Teknikbeslut att bekräfta med kunden
- Hosting i EU (Vercel Frankfurt-region) – OK för offentliga kunder?
- Inloggning via e-post + lösenord, eller vill de använda sitt Microsoft 365-konto (SSO)?
- Domän: Ska systemet ligga på en subdomän som app.apmproject.se?
