const TENANT_ID = process.env.AZURE_AD_TENANT_ID!;
const CLIENT_ID = process.env.AZURE_AD_CLIENT_ID!;
const CLIENT_SECRET = process.env.AZURE_AD_CLIENT_SECRET!;

export const SHAREPOINT_DRIVE_ID =
  "b!IBBhuluhfkOVM_L80mws4UYHTaQ4iNNMm4T4ZcW_9RdYsanLRy6ISIbt39weeXYS";
export const SHAREPOINT_CUSTOMER_BASE_PATH =
  "APM Project/1. Försäljning/1. Kunder";
export const SHAREPOINT_BASE_URL = "https://62686mh.sharepoint.com";

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) {
    return cachedToken.token;
  }

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

  if (!res.ok) {
    throw new Error(`Failed to get access token: ${res.status}`);
  }

  const data = await res.json();
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
  return cachedToken.token;
}

async function graphGet(path: string) {
  const token = await getAccessToken();
  const res = await fetch(`https://graph.microsoft.com/v1.0${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 300 },
  });
  if (!res.ok) {
    throw new Error(`Graph API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export interface SharePointFile {
  id: string;
  name: string;
  webUrl: string;
  size: number;
  lastModifiedDateTime: string;
  isFolder: boolean;
  thumbnailUrl?: string;
}

export async function listFolderFiles(
  folderPath: string
): Promise<SharePointFile[]> {
  const encodedPath = encodeURIComponent(folderPath).replace(/%2F/g, "/");
  const data = await graphGet(
    `/drives/${SHAREPOINT_DRIVE_ID}/root:/${encodedPath}:/children?$select=id,name,webUrl,size,lastModifiedDateTime,folder,file&$orderby=name`
  );

  return (data.value || []).map(
    (item: Record<string, unknown>): SharePointFile => ({
      id: item.id as string,
      name: item.name as string,
      webUrl: item.webUrl as string,
      size: (item.size as number) || 0,
      lastModifiedDateTime: item.lastModifiedDateTime as string,
      isFolder: !!item.folder,
    })
  );
}

export async function listCustomerFiles(
  folderName: string
): Promise<SharePointFile[]> {
  // Skydd i djupet mot path traversal — folderName ska vara ett enskilt
  // mappnamn, aldrig en sökväg ut ur kundmappen.
  if (
    folderName.includes("..") ||
    folderName.includes("/") ||
    folderName.includes("\\")
  ) {
    throw new Error("Invalid folder name");
  }
  return listFolderFiles(`${SHAREPOINT_CUSTOMER_BASE_PATH}/${folderName}`);
}

export async function listCustomerFolders(): Promise<string[]> {
  const data = await graphGet(
    `/drives/${SHAREPOINT_DRIVE_ID}/root:/${encodeURIComponent(SHAREPOINT_CUSTOMER_BASE_PATH).replace(/%2F/g, "/")}:/children?$select=name,folder&$filter=folder ne null&$orderby=name`
  );
  return (data.value || [])
    .filter((item: Record<string, unknown>) => item.folder)
    .map((item: Record<string, unknown>) => item.name as string);
}
