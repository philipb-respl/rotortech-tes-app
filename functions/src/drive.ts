import { google } from 'googleapis';
import { defineSecret, defineString } from 'firebase-functions/params';

/** JSON key of a Google Cloud service account with access to the shared
 *  Drive folder (see docs/SETUP.md — the folder must live on a Shared
 *  Drive with the service account added as a Content Manager; a bare
 *  service account has no My Drive storage quota of its own). Stored as a
 *  Secret Manager secret, not a plain env var. */
export const driveServiceAccountKey = defineSecret('DRIVE_SERVICE_ACCOUNT_KEY');

/** Folder ID of "Rotortech Energy Solutions" root folder on the Shared
 *  Drive that TES PDFs are filed under. Empty default so the emulator and
 *  a fresh deploy boot without an interactive prompt; saveTesPdf below
 *  raises a clear error if a real save is attempted before this is set. */
export const driveRootFolderId = defineString('DRIVE_ROOT_FOLDER_ID', { default: '' });

let driveClient: ReturnType<typeof google.drive> | null = null;

function getDrive() {
  if (!driveClient) {
    const key = JSON.parse(driveServiceAccountKey.value());
    const auth = new google.auth.JWT({
      email: key.client_email,
      key: key.private_key,
      scopes: ['https://www.googleapis.com/auth/drive'],
    });
    driveClient = google.drive({ version: 'v3', auth });
  }
  return driveClient;
}

/** Finds a child folder by name under `parentId`, creating it if missing.
 *  Supports Shared Drives throughout (`supportsAllDrives`). */
async function ensureFolder(parentId: string, name: string): Promise<string> {
  const drive = getDrive();
  const escaped = name.replace(/'/g, "\\'");
  const list = await drive.files.list({
    q: `'${parentId}' in parents and name = '${escaped}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    fields: 'files(id, name)',
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
    corpora: 'allDrives',
  });
  const existing = list.data.files?.[0];
  if (existing?.id) return existing.id;

  const created = await drive.files.create({
    requestBody: { name, mimeType: 'application/vnd.google-apps.folder', parents: [parentId] },
    fields: 'id',
    supportsAllDrives: true,
  });
  if (!created.data.id) throw new Error(`Failed to create Drive folder "${name}"`);
  return created.data.id;
}

async function findFileInFolder(folderId: string, name: string): Promise<string | null> {
  const drive = getDrive();
  const escaped = name.replace(/'/g, "\\'");
  const list = await drive.files.list({
    q: `'${folderId}' in parents and name = '${escaped}' and trashed = false`,
    fields: 'files(id, name)',
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
    corpora: 'allDrives',
  });
  return list.data.files?.[0]?.id ?? null;
}

export interface SavedTesPdf {
  fileId: string;
  webViewLink: string;
  folderPath: string;
}

/** Uploads (or, on resubmission/finalize, overwrites) `{tesNo}.pdf` under
 *  `<root>/Travel Expense Settlements/{year}/{employeeName}/`, matching the
 *  path shown in the app's "Saved to Google Drive" confirmation. */
export async function saveTesPdf(opts: {
  year: number;
  employeeName: string;
  tesNo: string;
  pdf: Buffer;
}): Promise<SavedTesPdf> {
  const drive = getDrive();
  const root = driveRootFolderId.value();
  if (!root) {
    throw new Error('DRIVE_ROOT_FOLDER_ID is not configured — see docs/SETUP.md.');
  }

  const settlementsFolder = await ensureFolder(root, 'Travel Expense Settlements');
  const yearFolder = await ensureFolder(settlementsFolder, String(opts.year));
  const employeeFolder = await ensureFolder(yearFolder, opts.employeeName);

  const fileName = `${opts.tesNo}.pdf`;
  const media = { mimeType: 'application/pdf', body: bufferToStream(opts.pdf) };
  const existingId = await findFileInFolder(employeeFolder, fileName);

  let fileId: string;
  if (existingId) {
    await drive.files.update({ fileId: existingId, media, supportsAllDrives: true });
    fileId = existingId;
  } else {
    const created = await drive.files.create({
      requestBody: { name: fileName, parents: [employeeFolder] },
      media,
      fields: 'id',
      supportsAllDrives: true,
    });
    if (!created.data.id) throw new Error('Drive upload did not return a file id.');
    fileId = created.data.id;
  }

  const meta = await drive.files.get({
    fileId,
    fields: 'webViewLink',
    supportsAllDrives: true,
  });

  return {
    fileId,
    webViewLink: meta.data.webViewLink ?? `https://drive.google.com/file/d/${fileId}/view`,
    folderPath: `Rotortech Energy Solutions/Travel Expense Settlements/${opts.year}/${opts.employeeName}/${fileName}`,
  };
}

function bufferToStream(buffer: Buffer) {
  const { Readable } = require('node:stream');
  return Readable.from(buffer);
}
