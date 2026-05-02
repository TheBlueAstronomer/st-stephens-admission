/**
 * Microsoft Graph service for SharePoint/OneDrive operations.
 * Requires AZURE_AD_CLIENT_ID, AZURE_AD_CLIENT_SECRET, AZURE_AD_TENANT_ID,
 * SHAREPOINT_SITE_ID env vars.
 */

export interface SharePointUploadResult {
  fileUrl:     string;
  driveItemId: string;
  fileName:    string;
}

export interface SharePointFolderResult {
  folderUrl: string;
  driveItemId: string;
}

function getGraphConfig() {
  return {
    clientId:     process.env.AZURE_AD_CLIENT_ID!,
    clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
    tenantId:     process.env.AZURE_AD_TENANT_ID!,
    siteId:       process.env.SHAREPOINT_SITE_ID ?? '',
  };
}

async function getAccessToken(): Promise<string> {
  const { clientId, clientSecret, tenantId } = getGraphConfig();

  const response = await fetch(
    `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type:    'client_credentials',
        client_id:     clientId,
        client_secret: clientSecret,
        scope:         'https://graph.microsoft.com/.default',
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`Graph token request failed: ${response.status}`);
  }

  const json = (await response.json()) as { access_token: string };
  return json.access_token;
}

export async function createSharePointFolder(
  applicantId: string,
): Promise<SharePointFolderResult> {
  const { siteId } = getGraphConfig();
  const token = await getAccessToken();

  const folderName = applicantId;
  const url = `https://graph.microsoft.com/v1.0/sites/${siteId}/drive/root/children`;

  const response = await fetch(url, {
    method:  'POST',
    headers: {
      Authorization:  `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name:                              folderName,
      folder:                            {},
      '@microsoft.graph.conflictBehavior': 'rename',
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create SharePoint folder: ${response.status}`);
  }

  const item = (await response.json()) as {
    id: string;
    webUrl: string;
  };

  return { folderUrl: item.webUrl, driveItemId: item.id };
}

export async function uploadToSharePoint(
  applicantId: string,
  fileName: string,
  fileBuffer: ArrayBuffer,
): Promise<SharePointUploadResult> {
  const { siteId } = getGraphConfig();
  const token = await getAccessToken();

  const encodedPath = encodeURIComponent(`${applicantId}/${fileName}`);
  const url = `https://graph.microsoft.com/v1.0/sites/${siteId}/drive/root:/${encodedPath}:/content`;

  const response = await fetch(url, {
    method:  'PUT',
    headers: {
      Authorization:  `Bearer ${token}`,
      'Content-Type': 'application/octet-stream',
    },
    body: new Blob([fileBuffer]),
  });

  if (!response.ok) {
    throw new Error(`SharePoint upload failed: ${response.status}`);
  }

  const item = (await response.json()) as {
    id: string;
    name: string;
    webUrl: string;
  };

  return {
    fileUrl:     item.webUrl,
    driveItemId: item.id,
    fileName:    item.name,
  };
}
