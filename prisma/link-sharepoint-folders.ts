import { config } from "dotenv";
config({ path: ".env.local" });

import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();

const TENANT_ID = process.env.AZURE_AD_TENANT_ID!;
const CLIENT_ID = process.env.AZURE_AD_CLIENT_ID!;
const CLIENT_SECRET = process.env.AZURE_AD_CLIENT_SECRET!;

const DRIVE_ID =
  "b!IBBhuluhfkOVM_L80mws4UYHTaQ4iNNMm4T4ZcW_9RdYsanLRy6ISIbt39weeXYS";
const CUSTOMER_PATH = "APM Project/1. Försäljning/1. Kunder";

async function getToken(): Promise<string> {
  const res = await fetch(
    `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        scope: "https://graph.microsoft.com/.default",
        grant_type: "client_credentials",
      }),
    }
  );
  const data = await res.json();
  return data.access_token;
}

interface FolderInfo {
  name: string;
  webUrl: string;
}

async function getCustomerFolders(token: string): Promise<FolderInfo[]> {
  const encodedPath = encodeURIComponent(CUSTOMER_PATH).replace(/%2F/g, "/");
  const res = await fetch(
    `https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/root:/${encodedPath}:/children?$select=name,webUrl,folder&$top=200`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const data = await res.json();
  return (data.value || [])
    .filter((item: Record<string, unknown>) => item.folder)
    .map((item: Record<string, unknown>) => ({
      name: item.name as string,
      webUrl: item.webUrl as string,
    }));
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/\s+ab$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function main() {
  const token = await getToken();
  const folders = await getCustomerFolders(token);
  console.log(`Found ${folders.length} SharePoint customer folders\n`);

  const customers = await prisma.customer.findMany({
    select: { id: true, companyName: true, onedriveFolderUrl: true },
  });
  console.log(`Found ${customers.length} customers in database\n`);

  let matched = 0;
  let skipped = 0;
  const unmatched: string[] = [];

  for (const folder of folders) {
    const normalizedFolder = normalize(folder.name);

    const customer = customers.find((c) => {
      const normalizedName = normalize(c.companyName);
      return (
        normalizedName === normalizedFolder ||
        normalizedName.startsWith(normalizedFolder) ||
        normalizedFolder.startsWith(normalizedName) ||
        normalizedName.includes(normalizedFolder) ||
        normalizedFolder.includes(normalizedName)
      );
    });

    if (customer) {
      if (customer.onedriveFolderUrl) {
        console.log(
          `  SKIP  ${folder.name} → ${customer.companyName} (already linked)`
        );
        skipped++;
      } else {
        await prisma.customer.update({
          where: { id: customer.id },
          data: { onedriveFolderUrl: folder.webUrl },
        });
        console.log(`  LINK  ${folder.name} → ${customer.companyName}`);
        matched++;
      }
    } else {
      unmatched.push(folder.name);
    }
  }

  console.log(`\n--- Results ---`);
  console.log(`Linked: ${matched}`);
  console.log(`Already linked: ${skipped}`);
  console.log(`Unmatched folders: ${unmatched.length}`);
  if (unmatched.length > 0) {
    console.log(`\nUnmatched folders:`);
    unmatched.forEach((f) => console.log(`  - ${f}`));
  }

  await prisma.$disconnect();
}

main().catch(console.error);
