import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // --- Customers ---
  const gbg = await prisma.customer.create({
    data: {
      companyName: "Göteborgs Stad – Kulturförvaltningen",
      orgNumber: "212000-1355",
      contactPerson: "Maria Andersson",
      email: "maria.andersson@goteborg.se",
      phone: "031-365 00 00",
      address: "Norra Hamngatan 14",
      city: "Göteborg",
      zipCode: "411 14",
      notes:
        "Ramavtal cirkulär inredning. Kontakta via upphandling@goteborg.se för nya beställningar.",
    },
  });

  const volvo = await prisma.customer.create({
    data: {
      companyName: "Volvo Group – Kontor Lundby",
      orgNumber: "556012-5790",
      contactPerson: "Erik Johansson",
      email: "erik.johansson@volvo.com",
      phone: "031-66 00 00",
      address: "Gropegårdsgatan 2",
      city: "Göteborg",
      zipCode: "405 08",
    },
  });

  const chalmers = await prisma.customer.create({
    data: {
      companyName: "Chalmers Tekniska Högskola",
      orgNumber: "556479-5598",
      contactPerson: "Anna Lindström",
      email: "anna.lindstrom@chalmers.se",
      phone: "031-772 10 00",
      address: "Chalmersplatsen 4",
      city: "Göteborg",
      zipCode: "412 96",
    },
  });

  const ica = await prisma.customer.create({
    data: {
      companyName: "ICA Fastigheter",
      orgNumber: "556033-0717",
      contactPerson: "Per Svensson",
      email: "per.svensson@ica.se",
      phone: "08-561 500 00",
      address: "Svetsarvägen 16",
      city: "Solna",
      zipCode: "171 93",
      notes: "Nytt kontor planeras Q3 2026. Intresserad av cirkulär möblering.",
    },
  });

  // --- Projects (individual creates to get IDs) ---
  const kulturhuset = await prisma.project.create({
    data: {
      name: "Kulturhuset – ommöblering plan 3",
      description:
        "Byta ut slitna kontorsmöbler mot renoverade alternativ. Inventering + inköp + installation.",
      status: "active",
      customerId: gbg.id,
      hourlyRate: 850,
      startDate: new Date("2026-04-15"),
      endDate: new Date("2026-06-30"),
    },
  });

  const biblioteket = await prisma.project.create({
    data: {
      name: "Stadsbiblioteket – läshörna barn",
      description:
        "Ny läshörna med cirkulära möbler för barnavdelningen. Moodboard godkänd.",
      status: "active",
      customerId: gbg.id,
      hourlyRate: 850,
      startDate: new Date("2026-05-01"),
    },
  });

  const volvoLundby = await prisma.project.create({
    data: {
      name: "Volvo Lundby – kontorslandskap",
      description:
        "150 arbetsplatser med begagnade skrivbord och stolar. Leverans i tre etapper.",
      status: "active",
      customerId: volvo.id,
      hourlyRate: 950,
      startDate: new Date("2026-03-01"),
      endDate: new Date("2026-08-31"),
    },
  });

  const studenthub = await prisma.project.create({
    data: {
      name: "Chalmers – studenthub Johanneberg",
      description:
        "Inredning av ny studenthub. Fokus på flexibla möbler och hållbara material.",
      status: "paused",
      customerId: chalmers.id,
      hourlyRate: 850,
      startDate: new Date("2026-02-01"),
    },
  });

  const icaSolna = await prisma.project.create({
    data: {
      name: "ICA Solna – kontorskonvertering",
      description:
        "Offertfas. Konvertera befintlig lokal till modernt kontor med cirkulär profil.",
      status: "active",
      customerId: ica.id,
      hourlyRate: 950,
    },
  });

  await prisma.project.create({
    data: {
      name: "Göteborgs Stad – inventering Majorna",
      description:
        "Inventering av befintliga möbler i tre förvaltningskontor i Majorna.",
      status: "completed",
      customerId: gbg.id,
      hourlyRate: 850,
      startDate: new Date("2026-01-10"),
      endDate: new Date("2026-02-15"),
    },
  });

  // --- Time Entries (spread across active projects) ---
  await prisma.timeEntry.createMany({
    data: [
      { projectId: kulturhuset.id, date: new Date("2026-04-16"), hours: 4, description: "Inventering plan 3 – kontor öst" },
      { projectId: kulturhuset.id, date: new Date("2026-04-17"), hours: 6, description: "Inventering plan 3 – kontor väst" },
      { projectId: kulturhuset.id, date: new Date("2026-04-22"), hours: 3.5, description: "Offertunderlag och produktval" },
      { projectId: kulturhuset.id, date: new Date("2026-05-05"), hours: 2, description: "Möte med Maria – färgval" },
      { projectId: kulturhuset.id, date: new Date("2026-05-12"), hours: 5, description: "Beställning och logistikplanering" },
      { projectId: biblioteket.id, date: new Date("2026-05-02"), hours: 3, description: "Platsbesök och mätning" },
      { projectId: biblioteket.id, date: new Date("2026-05-08"), hours: 4, description: "Moodboard och materialval" },
      { projectId: biblioteket.id, date: new Date("2026-05-14"), hours: 2.5, description: "Leverantörskontakt – sittmöbler" },
      { projectId: volvoLundby.id, date: new Date("2026-03-10"), hours: 8, description: "Inventering etapp 1 – plan 2" },
      { projectId: volvoLundby.id, date: new Date("2026-03-15"), hours: 6, description: "Produktval skrivbord etapp 1" },
      { projectId: volvoLundby.id, date: new Date("2026-04-02"), hours: 4, description: "Koordinering med fastighetsavd" },
      { projectId: volvoLundby.id, date: new Date("2026-04-20"), hours: 7, description: "Installation etapp 1" },
      { projectId: volvoLundby.id, date: new Date("2026-05-10"), hours: 5.5, description: "Inventering etapp 2 – plan 4" },
      { projectId: icaSolna.id, date: new Date("2026-05-06"), hours: 3, description: "Platsbesök Solna" },
      { projectId: icaSolna.id, date: new Date("2026-05-13"), hours: 4, description: "Offertframtagning" },
    ],
  });

  // --- Quotes ---
  const quoteVolvo = await prisma.quote.create({
    data: {
      quoteNumber: 1001,
      status: "sent",
      customerId: volvo.id,
      projectId: volvoLundby.id,
      validUntil: new Date("2026-06-15"),
      deliveryTerms: "Fritt levererat Gropegårdsgatan 2, Göteborg",
      paymentTerms: "30 dagar netto",
      notes: "Etapp 2 av 3. Inkluderar skrivbord, stolar och skärmväggar.",
    },
  });

  const quoteIca = await prisma.quote.create({
    data: {
      quoteNumber: 1002,
      status: "draft",
      customerId: ica.id,
      projectId: icaSolna.id,
      validUntil: new Date("2026-07-01"),
      deliveryTerms: "Fritt levererat Svetsarvägen 16, Solna",
      paymentTerms: "30 dagar netto",
      notes: "Preliminär offert – inväntar planritning.",
    },
  });

  const quoteGbg = await prisma.quote.create({
    data: {
      quoteNumber: 1003,
      status: "accepted",
      customerId: gbg.id,
      projectId: kulturhuset.id,
      validUntil: new Date("2026-05-30"),
      deliveryTerms: "Fritt levererat Norra Hamngatan 14",
      paymentTerms: "30 dagar netto",
    },
  });

  // --- Quote Items ---
  await prisma.quoteItem.createMany({
    data: [
      { quoteId: quoteVolvo.id, description: "Skrivbord ek 160×80 – renoverat", unit: "st", quantity: 50, unitPrice: 4500, costPrice: 2200, discount: 0, sortOrder: 1 },
      { quoteId: quoteVolvo.id, description: "Kontorsstol ergonomisk – renoverad", unit: "st", quantity: 50, unitPrice: 3800, costPrice: 1800, discount: 0, sortOrder: 2 },
      { quoteId: quoteVolvo.id, description: "Skärmvägg 120×160 – återbruk", unit: "st", quantity: 25, unitPrice: 2200, costPrice: 900, discount: 5, sortOrder: 3 },
      { quoteId: quoteVolvo.id, description: "Transport och installation", unit: "paket", quantity: 1, unitPrice: 35000, costPrice: 22000, discount: 0, sortOrder: 4 },

      { quoteId: quoteIca.id, description: "Höj/sänk-skrivbord 160×80", unit: "st", quantity: 30, unitPrice: 6500, costPrice: 3500, discount: 0, sortOrder: 1 },
      { quoteId: quoteIca.id, description: "Kontorsstol premium – renoverad", unit: "st", quantity: 30, unitPrice: 4200, costPrice: 2100, discount: 0, sortOrder: 2 },
      { quoteId: quoteIca.id, description: "Förvaringsskåp – återbruk", unit: "st", quantity: 15, unitPrice: 3200, costPrice: 1400, discount: 10, sortOrder: 3 },

      { quoteId: quoteGbg.id, description: "Konferensbord oval – renoverat", unit: "st", quantity: 2, unitPrice: 12000, costPrice: 5500, discount: 0, sortOrder: 1 },
      { quoteId: quoteGbg.id, description: "Besöksstol stapelbar – renoverad", unit: "st", quantity: 20, unitPrice: 1800, costPrice: 750, discount: 0, sortOrder: 2 },
      { quoteId: quoteGbg.id, description: "Bokhylla ek – återbruk", unit: "st", quantity: 6, unitPrice: 4500, costPrice: 1800, discount: 0, sortOrder: 3 },
      { quoteId: quoteGbg.id, description: "Montering och upphämtning av gammalt", unit: "tim", quantity: 16, unitPrice: 850, costPrice: 450, discount: 0, sortOrder: 4 },
    ],
  });

  // --- Delivery Events ---
  await prisma.deliveryEvent.createMany({
    data: [
      { type: "delivery", date: new Date("2026-05-19"), time: "08:00", projectId: kulturhuset.id, customerId: gbg.id, address: "Norra Hamngatan 14, Göteborg", notes: "Leverans konferensmöbler plan 3. Ring port 031-365 00 10." },
      { type: "installation", date: new Date("2026-05-20"), time: "07:30", projectId: kulturhuset.id, customerId: gbg.id, address: "Norra Hamngatan 14, Göteborg", notes: "Montering konferensbord + stolar" },
      { type: "pickup", date: new Date("2026-05-20"), time: "13:00", projectId: kulturhuset.id, customerId: gbg.id, address: "Norra Hamngatan 14, Göteborg", notes: "Hämta gamla möbler plan 3" },
      { type: "delivery", date: new Date("2026-05-26"), time: "09:00", projectId: volvoLundby.id, customerId: volvo.id, address: "Gropegårdsgatan 2, Göteborg", notes: "Etapp 2 – skrivbord plan 4. Godsmottagning port B." },
      { type: "installation", date: new Date("2026-05-27"), time: "07:00", projectId: volvoLundby.id, customerId: volvo.id, address: "Gropegårdsgatan 2, Göteborg", notes: "Installation skrivbord + stolar etapp 2" },
      { type: "delivery", date: new Date("2026-06-02"), time: "10:00", projectId: biblioteket.id, customerId: gbg.id, address: "Götaplatsen 3, Göteborg", notes: "Leverans sittmöbler barnavdelning" },
      { type: "installation", date: new Date("2026-06-03"), projectId: biblioteket.id, customerId: gbg.id, address: "Götaplatsen 3, Göteborg", notes: "Montering läshörna" },
    ],
  });

  console.log(
    "Seed complete: 4 customers, 6 projects, 15 time entries, 3 quotes with items, 7 delivery events"
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
