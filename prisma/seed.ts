import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

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

  await prisma.project.createMany({
    data: [
      {
        name: "Kulturhuset – ommöblering plan 3",
        description:
          "Byta ut slitna kontorsmöbler mot renoverade alternativ. Inventering + inköp + installation.",
        status: "active",
        customerId: gbg.id,
        hourlyRate: 850,
        startDate: new Date("2026-04-15"),
        endDate: new Date("2026-06-30"),
      },
      {
        name: "Stadsbiblioteket – läshörna barn",
        description:
          "Ny läshörna med cirkulära möbler för barnavdelningen. Moodboard godkänd.",
        status: "active",
        customerId: gbg.id,
        hourlyRate: 850,
        startDate: new Date("2026-05-01"),
      },
      {
        name: "Volvo Lundby – kontorslandskap",
        description:
          "150 arbetsplatser med begagnade skrivbord och stolar. Leverans i tre etapper.",
        status: "active",
        customerId: volvo.id,
        hourlyRate: 950,
        startDate: new Date("2026-03-01"),
        endDate: new Date("2026-08-31"),
      },
      {
        name: "Chalmers – studenthub Johanneberg",
        description:
          "Inredning av ny studenthub. Fokus på flexibla möbler och hållbara material.",
        status: "paused",
        customerId: chalmers.id,
        hourlyRate: 850,
        startDate: new Date("2026-02-01"),
      },
      {
        name: "ICA Solna – kontorskonvertering",
        description:
          "Offertfas. Konvertera befintlig lokal till modernt kontor med cirkulär profil.",
        status: "active",
        customerId: ica.id,
        hourlyRate: 950,
      },
      {
        name: "Göteborgs Stad – inventering Majorna",
        description:
          "Inventering av befintliga möbler i tre förvaltningskontor i Majorna.",
        status: "completed",
        customerId: gbg.id,
        hourlyRate: 850,
        startDate: new Date("2026-01-10"),
        endDate: new Date("2026-02-15"),
      },
    ],
  });

  console.log("Seed complete: 4 customers, 6 projects");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
