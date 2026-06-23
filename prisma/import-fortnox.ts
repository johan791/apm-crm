import { config } from "dotenv";
config({ path: ".env.local" });

import { PrismaClient } from "../src/generated/prisma";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

// --- CSV Parser for Fortnox export format ---
// Fortnox wraps each data row in outer quotes with "" for internal quoted values

function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      values.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  values.push(current.trim());
  return values;
}

function parseFortnoxCSV(filePath: string): Record<string, string>[] {
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n").filter((l) => l.trim());
  const headers = parseCSVLine(lines[0]);
  const records: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    let line = lines[i].trim();
    if (!line) continue;

    // Strip outer quotes wrapping the entire row
    if (line.startsWith('"') && line.endsWith('"')) {
      line = line.slice(1, -1);
    }

    const values = parseCSVLine(line);
    const record: Record<string, string> = {};
    headers.forEach((h, idx) => {
      record[h] = values[idx] || "";
    });
    records.push(record);
  }

  return records;
}

// --- Helpers ---

function cleanOrgNumber(raw: string): string | null {
  if (!raw) return null;
  const cleaned = raw.replace(/[^0-9]/g, "");
  if (cleaned.length < 6) return null;
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 6)}-${cleaned.slice(6)}`;
  }
  if (cleaned.length === 12) {
    return `${cleaned.slice(2, 8)}-${cleaned.slice(8)}`;
  }
  return cleaned;
}

function cleanPhone(raw: string): string | null {
  if (!raw) return null;
  const cleaned = raw.replace(/[^0-9+-\s]/g, "").trim();
  return cleaned || null;
}

function mapResponsible(
  name: string,
  userMap: Record<string, string>
): string | null {
  if (!name) return null;
  const lower = name.toLowerCase().trim();
  if (lower.includes("linda")) return userMap["linda"];
  if (lower.includes("caroline")) return userMap["caroline"];
  if (lower.includes("robert")) return userMap["robert"];
  // Mikael Sandqvist was a former employee — leave unassigned
  return null;
}

async function main() {
  console.log("=== Fortnox Import ===\n");

  // --- 1. Look up existing users ---
  const users = await prisma.user.findMany();
  const userMap: Record<string, string> = {};
  for (const u of users) {
    userMap[u.name.toLowerCase()] = u.id;
  }
  console.log(`Found ${users.length} users: ${users.map((u) => u.name).join(", ")}`);

  if (!userMap["linda"] || !userMap["caroline"] || !userMap["robert"]) {
    console.error("Missing required users (Linda, Caroline, Robert). Run seed first.");
    process.exit(1);
  }

  // --- 2. Delete existing demo data ---
  console.log("\nRemoving demo data...");
  const existingCustomers = await prisma.customer.findMany();
  if (existingCustomers.length > 0 && existingCustomers.length <= 10) {
    // Only auto-delete if it looks like demo data (few records)
    await prisma.activity.deleteMany({});
    await prisma.emailLog.deleteMany({});
    await prisma.deliveryEvent.deleteMany({});
    await prisma.quoteItem.deleteMany({});
    await prisma.quote.deleteMany({});
    await prisma.projectFile.deleteMany({});
    await prisma.projectPartner.deleteMany({});
    await prisma.invoiceBasis.deleteMany({});
    await prisma.timeEntry.deleteMany({});
    await prisma.project.deleteMany({});
    await prisma.contact.deleteMany({});
    await prisma.customer.deleteMany({});
    console.log(`Deleted ${existingCustomers.length} demo customers and related data.`);
  } else if (existingCustomers.length > 10) {
    console.log(
      `Found ${existingCustomers.length} existing customers — skipping delete (looks like real data). Will upsert instead.`
    );
  }

  // --- 3. Parse customer CSV ---
  const csvPath = path.join(__dirname, "..", "kundregister.csv");
  console.log(`\nParsing ${csvPath}...`);
  const rawCustomers = parseFortnoxCSV(csvPath);
  console.log(`Parsed ${rawCustomers.length} rows from CSV.`);

  // Deduplicate by customer_number, prefer entries with more data
  const customerMap = new Map<string, Record<string, string>>();
  let skipped = 0;

  for (const row of rawCustomers) {
    const custNum = row.customer_number;
    const name = row.name;

    // Skip broken/test entries
    if (!name || name.length < 2) {
      skipped++;
      continue;
    }
    // Skip the weird "1042,1043" entry
    if (custNum && custNum.includes(",")) {
      skipped++;
      continue;
    }

    const key = custNum || name;
    const existing = customerMap.get(key);

    if (!existing) {
      customerMap.set(key, row);
    } else {
      // Keep the one with more filled fields
      const existingFilled = Object.values(existing).filter(Boolean).length;
      const newFilled = Object.values(row).filter(Boolean).length;
      if (newFilled > existingFilled) {
        customerMap.set(key, row);
      }
    }
  }

  console.log(
    `After dedup: ${customerMap.size} unique customers (${skipped} skipped)`
  );

  // --- 4. Create customers + contacts ---
  console.log("\nImporting customers...");
  const customerIdMap = new Map<string, string>(); // customerNumber → prisma id
  let created = 0;
  let contacts = 0;

  for (const [key, row] of customerMap) {
    const phone =
      cleanPhone(row.invoice_phone) ||
      cleanPhone(row.invoice_phone2) ||
      cleanPhone(row.delivery_phone) ||
      null;

    const address = row.invoice_address || row.visit_address || null;
    const city = row.invoice_city || row.visit_address_city || null;
    const zipCode = row.invoice_zip_code || row.visit_address_zip_code || null;

    const customer = await prisma.customer.create({
      data: {
        companyName: row.name,
        customerNumber: row.customer_number || null,
        orgNumber: cleanOrgNumber(row.organisation_number),
        contactPerson: row.your_reference || null,
        email: row.email || null,
        phone,
        address,
        city,
        zipCode,
        responsibleUserId: mapResponsible(row.our_reference, userMap),
      },
    });

    customerIdMap.set(key, customer.id);
    if (row.customer_number) {
      customerIdMap.set(row.customer_number, customer.id);
    }
    if (row.organisation_number) {
      customerIdMap.set(row.organisation_number, customer.id);
    }
    created++;

    // Create contact from your_reference if it exists
    if (row.your_reference) {
      await prisma.contact.create({
        data: {
          customerId: customer.id,
          name: row.your_reference,
          email:
            row.email_offer || row.email_order || row.email || null,
          phone,
        },
      });
      contacts++;
    }
  }

  console.log(`Created ${created} customers and ${contacts} contacts.`);

  // --- 5. Create active projects from Fortnox project list ---
  console.log("\nImporting active projects...");

  // Project data from Fortnox PDF (projects with start 2025+ or still active long-term)
  const activeProjects = [
    {
      fortnoxNr: 25,
      name: "Göteborgs Stad",
      start: "2024-11-14",
      end: "2028-05-02",
      leader: "linda",
      customerKey: "5592790041", // Göteborgs kommun 230
    },
    {
      fortnoxNr: 27,
      name: "Dalängsskolan",
      start: "2025-05-07",
      end: null,
      leader: "linda",
      customerKey: "5592789997", // Lidköpings kommun
    },
    {
      fortnoxNr: 28,
      name: "FA-TEC",
      start: "2025-08-19",
      end: null,
      leader: "linda",
      customerKey: "5592789999", // FA-Tec i Falkenberg AB
    },
    {
      fortnoxNr: 29,
      name: "Sven Gullins Fastigheter",
      start: "2025-08-27",
      end: null,
      leader: "caroline",
      customerKey: "1201", // Aktiebolaget Sven Gulin
    },
    {
      fortnoxNr: 30,
      name: "Hydroscand",
      start: "2026-02-13",
      end: null,
      leader: "caroline",
      customerKey: "5592790014", // Hydroscand Automotive AB
    },
    {
      fortnoxNr: 31,
      name: "Lots",
      start: "2025-12-01",
      end: null,
      leader: null,
      customerKey: "5592790011", // Lots Ekonomi AB
    },
    {
      fortnoxNr: 32,
      name: "Gekås",
      start: "2026-02-13",
      end: null,
      leader: null,
      customerKey: "5592790029", // Gekås Ullared AB
    },
    {
      fortnoxNr: 33,
      name: "TA Gruppen",
      start: "2026-02-13",
      end: null,
      leader: null,
      customerKey: "TA Gruppen", // No direct match — will try name match
    },
    {
      fortnoxNr: 34,
      name: "ICA Angered",
      start: "2026-01-01",
      end: null,
      leader: null,
      customerKey: "5592790013", // Malövikens Mat AB Maxi ICA
    },
    {
      fortnoxNr: 35,
      name: "Härryda Kommun",
      start: "2026-01-01",
      end: null,
      leader: null,
      customerKey: "1084", // Härryda Kommun
    },
    {
      fortnoxNr: 36,
      name: "Möbler lagret",
      start: "2026-01-01",
      end: null,
      leader: null,
      customerKey: "3000", // Rekomo AB
    },
    {
      fortnoxNr: 37,
      name: "Gekås Ullared Hotellet",
      start: "2026-03-20",
      end: "2026-06-30",
      leader: "linda",
      customerKey: "5592790029", // Gekås Ullared AB
    },
    {
      fortnoxNr: 38,
      name: "Proflow",
      start: "2026-03-01",
      end: "2026-09-30",
      leader: "linda",
      customerKey: "5592790037", // ProFlow AB
    },
    {
      fortnoxNr: 39,
      name: "ICA Mölndal",
      start: "2026-04-30",
      end: null,
      leader: "linda",
      customerKey: "5592790042", // Matmarknaden i Mölndal AB
    },
  ];

  let projectsCreated = 0;
  let projectsSkipped = 0;

  for (const proj of activeProjects) {
    const customerId = customerIdMap.get(proj.customerKey);

    if (!customerId) {
      console.log(
        `  ⚠ Project "${proj.name}" (Fortnox #${proj.fortnoxNr}): no matching customer for key "${proj.customerKey}" — skipped`
      );
      projectsSkipped++;
      continue;
    }

    const responsibleUserId = proj.leader ? userMap[proj.leader] : null;

    // Determine status based on end date
    let status = "active";
    if (proj.end) {
      const endDate = new Date(proj.end);
      if (endDate < new Date()) {
        status = "completed";
      }
    }

    await prisma.project.create({
      data: {
        name: proj.name,
        description: `Fortnox projekt #${proj.fortnoxNr}`,
        status,
        startDate: new Date(proj.start),
        endDate: proj.end ? new Date(proj.end) : null,
        customerId,
        responsibleUserId,
      },
    });

    console.log(
      `  ✓ Project "${proj.name}" → ${status} (Fortnox #${proj.fortnoxNr})`
    );
    projectsCreated++;
  }

  console.log(
    `\nCreated ${projectsCreated} projects (${projectsSkipped} skipped due to missing customer match).`
  );

  // --- 6. Summary ---
  const totalCustomers = await prisma.customer.count();
  const totalContacts = await prisma.contact.count();
  const totalProjects = await prisma.project.count();

  console.log("\n=== Import Complete ===");
  console.log(`Customers: ${totalCustomers}`);
  console.log(`Contacts:  ${totalContacts}`);
  console.log(`Projects:  ${totalProjects}`);
  console.log(`Users:     ${users.length} (unchanged)`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
