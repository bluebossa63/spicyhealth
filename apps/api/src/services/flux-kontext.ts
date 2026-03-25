import { fal } from '@fal-ai/client';
import { v4 as uuidv4 } from 'uuid';
import { BlobServiceClient, StorageSharedKeyCredential } from '@azure/storage-blob';

fal.config({ credentials: process.env.FAL_API_KEY! });

/**
 * Edit an existing photo using Flux Kontext Pro.
 * Takes a person's photo and applies style changes described in the prompt.
 * Returns the URL of the edited image (uploaded to Azure Blob).
 */
export async function fluxKontextEdit(
  imageUrl: string,
  stylePrompt: string,
): Promise<string> {
  const result = await fal.subscribe('fal-ai/flux-pro/kontext', {
    input: {
      prompt: stylePrompt,
      image_url: imageUrl,
    },
  }) as any;

  const outputUrl = result?.data?.images?.[0]?.url || result?.images?.[0]?.url;
  if (!outputUrl) throw new Error('No image returned from Flux Kontext');

  // Download and re-upload to our Azure Blob Storage for persistence
  const imgResponse = await fetch(outputUrl);
  if (!imgResponse.ok) throw new Error('Could not download Flux result');
  const buffer = Buffer.from(await imgResponse.arrayBuffer());
  return uploadToBlob(buffer, 'image/jpeg');
}

async function uploadToBlob(buffer: Buffer, contentType: string): Promise<string> {
  const accountName = process.env.STORAGE_ACCOUNT!;
  const accountKey = process.env.STORAGE_KEY!;
  const containerName = process.env.STORAGE_CONTAINER || 'media';
  const blobName = `umstyling/flux/${uuidv4()}.jpg`;

  const cred = new StorageSharedKeyCredential(accountName, accountKey);
  const client = new BlobServiceClient(`https://${accountName}.blob.core.windows.net`, cred);
  const blockBlob = client.getContainerClient(containerName).getBlockBlobClient(blobName);

  await blockBlob.uploadData(buffer, {
    blobHTTPHeaders: { blobContentType: contentType },
  });

  return blockBlob.url;
}
