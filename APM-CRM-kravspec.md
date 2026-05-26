# Kravspecifikation – APM-CRM, kompletterande funktioner

**Mottagare:** Claude Code
**Beställare:** V4i Mälardalen AB (Johan Eriksson) för slutkund APM Project
**Stack (befintlig):** Next.js, PostgreSQL/Neon, Vercel, svenskt gränssnitt, svenska URL:er
**Status:** Specifikation av funktioner som saknas i nuvarande system. Implementeras feature för feature i angiven prioritetsordning.

---

## 0. Bakgrund och avgränsning

APM-CRM hanterar idag kundregister, projektstyrning, offertpipeline, tidrapportering, leveransplanering, partnerregister, dashboard och användarhantering. Detta dokument specificerar kompletterande funktioner som identifierats som luckor mot APM:s verksamhet (cirkulär kontorsinredning, konsult- och projektledning, kunder i offentlig sektor).

**Utanför scope:** Livscykelspårning av enskilda möbler/artiklar (objektregister). Ej bekräftat kundbehov, tas separat med APM. Datamodellerna nedan är skrivna så att ett framtida objektregister kan adderas utan att bryta dessa funktioner — se noteringar märkta `[FRAMTID]`.

**Två styrande designmål för hela specen:**

1. **Röstinmatning i bil.** Det primära användningsscenariot för aktivitetsregistrering är en användare som sitter i bilen efter ett kundmöte och vill kunna säga, via telefonens diktering: *"Idag hade jag möte med Anna på Tengbom AB. Jag ska komma med en ny offert senast nästa måndag."* Steg 1 ska göra detta så friktionsfritt som möjligt. Gränssnittet måste fungera enhandsmässigt på mobil.
2. **Full insyn mellan tre användare.** APM har tre användare som var och en loggar in som sig själv. Om en användare är bortrest måste de andra två kunna hitta och läsa allt hen registrerat. "Ansvarig medarbetare" är en ägarmarkör, aldrig en synlighetsspärr. Se avsnitt 1B.

**Generella krav som gäller alla funktioner:**

- Följ befintliga kodkonventioner, mappstruktur och komponentmönster. Inspektera befintlig kod innan ny kod skrivs.
- Allt gränssnitt på svenska, svenska URL:er, konsekvent med befintlig terminologi.
- Multi-tenant-säkert: följ samma `organization_id`-mönster som befintliga tabeller om sådant finns.
- Respektera befintlig rollmodell (admin/användare) plus delningsmodellen i avsnitt 1B.
- Responsiv design (desktop + mobil), utskriftsstöd där relevant.
- Migrationer skrivs som versionerade SQL-migrationer i linje med befintlig hantering.
- Varje funktion levereras med uppdaterad dashboard-koppling där det anges.

---

## Prioritetsordning

1. **Aktiviteter och uppföljning** – inklusive röstinmatningsflödet. Störst nytta, bas för flera andra funktioner.
   - 1A. Aktivitetsmodell och röstanteckning (steg 1)
   - 1B. Delnings- och synlighetsmodell mellan användare
2. **Fakturaunderlag / ekonomiexport** – tar bort dubbelarbete från tidrapporteringen.
3. **E-postloggning mot kund/projekt** – steg 1 manuell, förberedd för Outlook/Graph.
4. **Anbudsstöd för offentlig upphandling** – bekräfta omfattning med kund först.
5. **Bildförhandsvisning av dokument** – minst kritisk, hög upplevd kvalitetshöjning.

---

## Funktion 1A – Aktiviteter och röstanteckning (steg 1)

### Syfte
Strukturerad registrering av aktiviteter och uppföljningar kopplade till kund, projekt eller offert, med ett röstinmatningsoptimerat flöde som primärt gränssnitt. Idag finns endast fritextanteckningar utan ansvarig eller datum.

### Viktigt designval – varför aktivitetstabell redan i steg 1
I steg 1 ska en röstanteckning bara bli en fritext som hamnar under rätt kund. Men den ska sparas som en post i tabellen `aktiviteter` nedan, inte i en separat lös notisstruktur. Skälet: steg 2 lägger till automatisk tolkning av den dikterade texten till strukturerade fält (typ, förfallodatum, kund). Om datan redan ligger i rätt tabell blir steg 2 ett påbyggnadssteg, inte en datamigrering. I steg 1 fylls bara `beskrivning`, `typ` och kundkoppling — övriga strukturfält lämnas tomma och sätts manuellt eller i steg 2.

### Röstinmatning – så löses det i steg 1
Ingen ljudhantering byggs i systemet. Användaren använder telefonens inbyggda tangentbordsdiktering (iOS/Android), som matar text direkt in i ett vanligt textfält. Systemets ansvar i steg 1 är enbart att tillhandahålla ett gränssnitt som är optimerat för detta:

- En tydlig, lättåtkomlig "Ny anteckning"-knapp, nåbar från startvy/dashboard och från kundvy.
- Ett stort flerradigt textfält med tillräckligt tryckyta för tumanvändning.
- En kundväljare med sök/typeahead, så att rätt kund kan väljas snabbt med en hand. Om kunden inte finns: möjlighet att spara anteckningen ändå med kundnamnet som fritext, för senare koppling (fält `okopplad_kund_text`).
- Minimalt antal obligatoriska fält: bara texten och kund (eller okopplat kundnamn). Allt annat valfritt.
- Spara-knappen ska vara stor och nå längst ned i tumzonen.

`[FRAMTID]` Steg 2: tolkning av dikterad text. En dikterad mening som "möte med Anna på Tengbom, ny offert senast nästa måndag" tolkas till `typ = mote`, kundmatchning mot Tengbom, samt en länkad uppföljningsaktivitet `typ = uppfoljning` med `forfallodatum` beräknat från "nästa måndag". Detta byggs inte nu, men modellen nedan rymmer det.

### Datamodell
Ny tabell `aktiviteter`:

| Fält | Typ | Kommentar |
|------|-----|-----------|
| id | uuid / serial | PK enligt befintlig konvention |
| typ | enum | `anteckning`, `uppgift`, `samtal`, `mote`, `mejl`, `uppfoljning`. Steg 1: röstanteckningar sparas som `anteckning` om inget annat anges |
| titel | text nullable | Kort rubrik, valfri i steg 1 |
| beskrivning | text | Fritext / dikterad text. Obligatorisk |
| status | enum | `oppen`, `klar`. Default `oppen` |
| forfallodatum | date nullable | Sätts manuellt i steg 1, tolkas i steg 2 |
| ansvarig_medarbetare_id | FK nullable | Default: inloggad användare |
| kund_id | FK nullable | |
| projekt_id | FK nullable | |
| offert_id | FK nullable | |
| upphandling_id | FK nullable | Förberedelse för Funktion 4 |
| okopplad_kund_text | text nullable | Kundnamn när kunden ännu inte finns i registret |
| relaterad_aktivitet_id | FK nullable | Länkar t.ex. en uppföljning till mötesanteckningen den kom ur |
| skapad_av | FK | Användare |
| skapad_at / uppdaterad_at | timestamp | |

Minst en av `kund_id`, `projekt_id`, `offert_id`, `upphandling_id` eller `okopplad_kund_text` ska vara satt.

### Funktionalitet
- Skapa (röstoptimerat flöde ovan), redigera, markera klar, ta bort aktivitet.
- Aktivitetslista inline på kund-, projekt- och offertvy, sorterad med öppna och närmast förfallande överst.
- Global aktivitetsvy med filter på status, ansvarig, typ, datumintervall samt fritextsök.
- Visuell markering av förfallna aktiviteter.
- Hantering av `okopplad_kund_text`: en vy eller filtrering som visar anteckningar som ännu saknar kundkoppling, så att de kan kopplas i efterhand.
- Befintlig anteckningsfunktion behålls; aktiviteter är ett komplement.

### Dashboard
- Befintlig ruta "offerter att följa upp" kopplas till aktiviteter `typ = uppfoljning`, öppen status, på offerter.
- Ny rad "Mina aktiviteter denna vecka": öppna aktiviteter där inloggad användare är ansvarig och förfallodatum infaller inom 7 dagar.
- Ny rad "Okopplade anteckningar": antal aktiviteter med ifyllt `okopplad_kund_text`.

### Acceptanskriterier
- En användare kan från mobilen, med en hand, öppna ny anteckning, diktera text, välja kund och spara på få tryck.
- En anteckning vars kund inte finns kan ändå sparas och senare kopplas.
- Röstanteckningen syns direkt på kundens vy och i global aktivitetsvy.
- Förfallna aktiviteter är visuellt urskiljbara.

---

## Funktion 1B – Delnings- och synlighetsmodell

### Syfte
APM har tre användare. Var och en loggar in som sig själv. Kärnkravet: om en användare är bortrest måste de andra två kunna hitta och läsa allt hen registrerat — kunder, projekt, aktiviteter, anteckningar, e-postloggar. Ingen data får vara otillgänglig för kollegorna.

### Modell – steg 1 (rekommenderad och default)
- **Alla tre användare ser all data.** Full läsåtkomst till samtliga kunder, projekt, offerter, aktiviteter, anteckningar och loggar.
- **"Ansvarig medarbetare" är en ägarmarkör, inte en spärr.** Den styr filter, sortering och dashboardens "mina"-vyer, men döljer aldrig något för övriga.
- **Alla tre kan redigera.** Ett trepersonersbolag behöver kunna täcka upp för varandra; redigeringsrättigheter ska inte vara knutna till ägarskap. `skapad_av` och `uppdaterad_at` loggas så att det går att se vem som gjort vad.
- Befintlig admin/användare-roll behålls för systemadministration (användarhantering m.m.), men påverkar inte synlighet av verksamhetsdata.
- "Mina"-vyer (Mina aktiviteter, Mina projekt) är bekvämlighetsfilter ovanpå den fullt delade datan — aldrig en avgränsning av vad som finns.

### Designnotering
Bygg INTE radnivåspärrar (row-level security som döljer rader per användare) för verksamhetsdata i steg 1. Det motverkar bortrest-scenariot direkt. Synlighet ska vara öppen mellan de tre; filtrering sköts i gränssnittet.

### Öppen fråga till beställare (Johan stämmer av med APM)
Ska enskilda anteckningar/uppföljningar kunna markeras som privata (ofärdiga, personliga noteringar)? Rekommendation för steg 1: **nej** — håll allt synligt, eftersom hela poängen med modellen är att inget ska vara gömt när någon är borta. Om APM uttryckligen vill ha en privat-flagga adderas fältet `privat boolean default false` på `aktiviteter` och respekteras i vyer. Bygg detta endast om beställaren bekräftar behovet.

### Acceptanskriterier
- Användare B kan, utan användare A närvarande, hitta och läsa alla aktiviteter, anteckningar och projekt som A registrerat.
- "Mina aktiviteter" visar inloggad användares poster men döljer inte övrigas i global vy.
- Det går att se vem som skapat och senast ändrat varje post.

---

## Funktion 2 – Fakturaunderlag och ekonomiexport

### Syfte
Tidrapporteringen beräknar belopp men landar aldrig i ett fakturerbart underlag; APM överför idag siffror manuellt till sitt bokföringssystem. Funktionen producerar strukturerat fakturaunderlag per projekt samt export för ekonomisystem.

### Avgränsning
Systemet ska **inte** bli ett faktureringssystem (ingen fakturanummerserie, ingen bokföring, ingen momsredovisning). Det producerar *underlag* som APM:s ekonomifunktion eller redovisningsbyrå hanterar vidare. Bekräfta med APM vilket ekonomisystem de använder (sannolikt Fortnox eller Visma) — det avgör om ett systemspecifikt exportformat behövs utöver CSV.

### Datamodell
Tillägg på befintlig tidsposttabell:

| Fält | Typ | Kommentar |
|------|-----|-----------|
| fakturerad | boolean | Default false |
| fakturaunderlag_id | FK nullable | |

Ny tabell `fakturaunderlag`:

| Fält | Typ | Kommentar |
|------|-----|-----------|
| id | uuid / serial | PK |
| projekt_id | FK | |
| period_start / period_slut | date | |
| skapad_at | timestamp | |
| skapad_av | FK | |
| total_timmar | numeric | Summerat vid generering |
| total_belopp | numeric | Summerat vid generering |

### Funktionalitet
- Från projektvy: välj period, se ofakturerade tidsposter, generera fakturaunderlag.
- Vid generering markeras ingående tidsposter `fakturerad = true` och kopplas till underlaget; de kan inte ingå i ett nytt underlag.
- Utskriftsvänlig vy i samma stil som befintlig offertutskrift.
- Export till CSV (semikolonseparerad, svensk Excel-kompatibel — samma konvention som Möbelsöks export). Kolumner: projekt, kund, datum, beskrivning, timmar, timpris, belopp.
- Möjlighet att öppna/ångra ett underlag (återställer tidsposterna till ofakturerade) så länge det inte låsts.
- `[FRAMTID]` Systemspecifikt Fortnox/Visma-importformat kan adderas senare; CSV räcker för v1.

### Dashboard
- Ny ruta "Ofakturerade timmar": summa timmar på aktiva projekt med `fakturerad = false`.

### Acceptanskriterier
- En tidspost kan endast ingå i ett fakturaunderlag.
- Genererat underlag kan skrivas ut och exporteras till CSV.
- Dashboard visar korrekt summa ofakturerade timmar.

---

## Funktion 3 – E-postloggning mot kund och projekt

### Syfte
Korrespondens lever idag i enskilda medarbetares Outlook. Funktionen ger en gemensam, sökbar korrespondenshistorik per kund och projekt — och är en uttalad förberedelse för en kommande Outlook-integration.

### Steg 1 – manuell loggning
Bygg i steg 1 endast manuell loggning. Användaren klistrar in ämne, innehåll och motpart, väljer riktning och kopplar till kund/projekt. Detta är medvetet enkelt men datamodellen nedan är dimensionerad för Graph-integrationen i steg 2.

### Datamodell
Ny tabell `epostloggar`:

| Fält | Typ | Kommentar |
|------|-----|-----------|
| id | uuid / serial | PK |
| riktning | enum | `inkommande`, `utgaende` |
| amne | text | |
| innehall | text | |
| motpart | text | E-postadress eller namn |
| datum | timestamp | Tidpunkt för mejlet |
| kund_id | FK nullable | |
| projekt_id | FK nullable | |
| loggad_av | FK | Användare |
| kalla | enum | `manuell`, `outlook`. Default `manuell`. Förberedelse för steg 2 |
| extern_id | text nullable | Microsoft Graph message-id, fylls i steg 2 för dedup |
| skapad_at | timestamp | |

Minst en av `kund_id`, `projekt_id` ska vara satt.

### Funktionalitet steg 1
- Manuell loggning enligt ovan.
- E-postlogg som kronologisk lista på kund- och projektvy, integrerad med eller intill aktivitetslistan.
- Fritextsök över loggar inom en kund/projekt.

### Steg 2 – Outlook/Microsoft Graph-integration (förberedelse)
Detta byggs INTE nu. Datamodellen ovan är förberedd: `kalla`, `extern_id`, `riktning`, `motpart` och `datum` motsvarar Graph-fält, och `extern_id` möjliggör dedup så att samma mejl inte loggas dubbelt. Integrationen följer Bvtler-mönstret (Microsoft Graph, GDPR-medveten pipeline).

**Vad Johan behöver återkomma med för att steg 2-specen ska kunna skrivas:**

1. Microsoft 365-miljö: har APM Microsoft 365 Business, och finns Exchange Online-postlådor för alla tre användare?
2. Entra ID (Azure AD): kan en app registreras i APM:s tenant, eller sköts det av extern IT-leverantör? Vem har global administratörsroll?
3. Behörighetsmodell: ska integrationen läsa varje användares egen brevlåda (delegated, varje användare kopplar sig själv) eller centralt över alla brevlådor (application permissions, `Mail.Read`)? Givet delningsmodellen i 1B är delegated per användare troligen rätt — varje användare kopplar sin egen Outlook, men loggarna blir synliga för alla tre.
4. Omfattning: ska alla mejl hämtas och kopplas, eller bara mejl till/från adresser som matchar en kund i registret? Rekommendation: endast matchande, för att undvika brus och GDPR-överskott.
5. Vilka behörigheter APM:s IT-policy tillåter, och om multi-tenant- eller single-tenant-appregistrering gäller.

När dessa uppgifter finns skrivs en separat steg 2-spec.

### Acceptanskriterier steg 1
- En användare kan logga ett mejl mot ett projekt och det syns i projektets historik.
- Loggar är sökbara per kund och projekt.
- `kalla` och `extern_id` finns i schemat även om de inte används i steg 1.

---

## Funktion 4 – Anbudsstöd för offentlig upphandling

### Syfte
APM har betydande andel kunder i offentlig sektor (kommuner, Göteborgs stad). Säljprocessen mot offentlig sektor följer upphandlingslogik — diarienummer, förfrågningsunderlag, inlämningsdeadline — och passar dåligt i den befintliga offertpipelinen, som är byggd för privat B2B.

### Viktigt – bekräfta före implementation
Omfattningen beror på hur stor del av APM:s affär som är offentlig upphandling. Johan stämmer av med APM innan funktionen byggs.

### Datamodell
Ny tabell `upphandlingar`:

| Fält | Typ | Kommentar |
|------|-----|-----------|
| id | uuid / serial | PK |
| titel | text | |
| upphandlande_myndighet | text | |
| diarienummer | text | |
| status | enum | `bevakas`, `under_arbete`, `inlamnat`, `vunnet`, `forlorat`, `avbrutet` |
| inlamningsdatum | date | Deadline för anbud |
| beslutsdatum | date nullable | |
| varde | numeric nullable | Uppskattat ordervärde |
| ansvarig_medarbetare_id | FK | |
| beskrivning | text | |
| kund_id | FK nullable | |
| skapad_at / uppdaterad_at | timestamp | |

### Funktionalitet
- Separat upphandlingsvy med eget statusflöde, vid sidan av offertpipelinen. Blanda inte ihop de två.
- Lista och detaljvy med filter på status och ansvarig.
- Aktiviteter (Funktion 1) kopplas till upphandling via `upphandling_id`. Anbudsdeadlines hanteras som aktiviteter.
- Vid status `vunnet`: skapa projekt från upphandlingen, analogt med befintlig "skapa projekt från offert".
- OneDrive-mappkoppling för förfrågningsunderlag, som befintlig dokumentkoppling.

### Dashboard
- Ny rad "Upphandlingar att lämna in": upphandlingar med status `bevakas`/`under_arbete` och inlämningsdatum inom 14 dagar.

### Acceptanskriterier
- En upphandling kan registreras, följas genom statusflödet och kopplas till aktiviteter med deadline.
- En vunnen upphandling kan konverteras till projekt.
- Upphandlingar är tydligt åtskilda från offertpipelinen i gränssnittet.

---

## Funktion 5 – Bildförhandsvisning av dokument

### Syfte
Dokumenthantering vilar på OneDrive-mappkoppling. För en inredningsverksamhet är moodboards och ritningar centrala; att öppna OneDrive separat för att se en bild skapar friktion. Funktionen ger förhandsvisning direkt i kund- och projektvy.

### Avgränsning
Bygg inte om dokumenthanteringen. OneDrive-kopplingen behålls som källa. Funktionen är ett visningslager ovanpå.

### Funktionalitet
- I kund- och projektvy: om kopplad OneDrive-mapp innehåller bildfiler (jpg, png, webp, samt pdf om rimligt), visa dem som miniatyrer i ett galleri.
- Klick på miniatyr öppnar större förhandsvisning (lightbox) eller länkar till filen i OneDrive.
- Bildhämtning via befintlig OneDrive-koppling/API. Om dagens koppling endast är en mapplänk utan API-åtkomst: notera detta för Johan — funktionen kräver läsåtkomst till mappinnehåll.
- Galleriet döljs vid utskrift.

### Acceptanskriterier
- Bildfiler i kopplad mapp visas som miniatyrer i kund-/projektvy.
- Miniatyr kan förstoras eller öppnas mot OneDrive.

---

## Sammanfattande implementationsordning

Bygg i prioritetsordning. Funktion 1A och 1B byggs först och tillsammans — aktivitetsmodellen och delningsmodellen är bas för Funktion 3 och 4. Funktion 3 steg 1 byggs med Graph-förberett schema; steg 2 väntar på integrationsuppgifterna i Funktion 3-avsnittet. Funktion 4 påbörjas inte förrän omfattningen bekräftats med APM. Varje funktion levereras komplett med migration, gränssnitt, dashboard-koppling och uppfyllda acceptanskriterier innan nästa påbörjas.
