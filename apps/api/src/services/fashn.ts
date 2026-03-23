import Fashn from 'fashn';
import { v4 as uuidv4 } from 'uuid';
import { BlobServiceClient, StorageSharedKeyCredential } from '@azure/storage-blob';

const client = new Fashn({ apiKey: process.env.FASHN_API_KEY! });

/**
 * Virtual try-on: takes a person photo and a garment image,
 * returns the person wearing the garment.
 */
export async function virtualTryOn(
  personImageUrl: string,
  garmentImageUrl: string,
): Promise<string> {
  const response = await client.predictions.subscribe({
    model_name: 'tryon-v1.6',
    inputs: {
      model_image: personImageUrl,
      garment_image: garmentImageUrl,
    },
  });

  if (response.status !== 'completed' || !response.output) {
    throw new Error(response.error?.message || 'Virtual try-on failed');
  }

  // Output is typically an array of image URLs or a single URL
  const resultUrl = Array.isArray(response.output) ? response.output[0] : response.output;
  if (!resultUrl || typeof resultUrl !== 'string') {
    throw new Error('No result image from FASHN');
  }

  // Download and re-upload to our Azure Blob Storage for persistence
  const imgResponse = await fetch(resultUrl);
  if (!imgResponse.ok) throw new Error('Could not download FASHN result');
  const buffer = Buffer.from(await imgResponse.arrayBuffer());
  return uploadToBlob(buffer, 'image/png');
}

async function uploadToBlob(buffer: Buffer, contentType: string): Promise<string> {
  const accountName = process.env.STORAGE_ACCOUNT!;
  const accountKey = process.env.STORAGE_KEY!;
  const containerName = process.env.STORAGE_CONTAINER || 'media';
  const blobName = `umstyling/tryon/${uuidv4()}.png`;

  const cred = new StorageSharedKeyCredential(accountName, accountKey);
  const blobClient = new BlobServiceClient(`https://${accountName}.blob.core.windows.net`, cred);
  const blockBlob = blobClient.getContainerClient(containerName).getBlockBlobClient(blobName);

  await blockBlob.uploadData(buffer, {
    blobHTTPHeaders: { blobContentType: contentType },
  });

  return blockBlob.url;
}
