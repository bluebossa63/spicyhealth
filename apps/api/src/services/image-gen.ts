import OpenAI from 'openai';
import { v4 as uuidv4 } from 'uuid';
import { BlobServiceClient, StorageSharedKeyCredential } from '@azure/storage-blob';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

/**
 * Generate a styled version of a look based on description + context from source image.
 * Since dall-e-2 image editing has strict format requirements, we use dall-e-3
 * to generate a new image that incorporates the style description.
 */
export async function generateStyledImage(
  sourceImageUrl: string,
  stylePrompt: string,
): Promise<string> {
  // Use DALL-E 3 to generate a new styled image based on the description
  const result = await openai.images.generate({
    model: 'dall-e-3',
    prompt: stylePrompt,
    size: '1024x1024',
    quality: 'standard',
  });

  const imageUrl = result.data?.[0]?.url;
  if (!imageUrl) throw new Error('No image URL returned from DALL-E 3');

  const imgResponse = await fetch(imageUrl);
  if (!imgResponse.ok) throw new Error('Could not download generated image');
  const generatedBuffer = Buffer.from(await imgResponse.arrayBuffer());
  return uploadToBlob(generatedBuffer, 'image/png');
}

/**
 * Generate a new style image from a text description (no source image).
 * Uses DALL-E 3 for high-quality style inspiration images.
 */
export async function generateStyleImage(
  stylePrompt: string,
): Promise<string> {
  const result = await openai.images.generate({
    model: 'dall-e-3',
    prompt: stylePrompt,
    size: '1024x1024',
    quality: 'standard',
  });

  const imageUrl = result.data?.[0]?.url;
  if (!imageUrl) throw new Error('No image URL returned from DALL-E 3');

  const imgResponse = await fetch(imageUrl);
  if (!imgResponse.ok) throw new Error('Could not download generated image');
  const generatedBuffer = Buffer.from(await imgResponse.arrayBuffer());
  return uploadToBlob(generatedBuffer, 'image/png');
}

async function uploadToBlob(buffer: Buffer, contentType: string): Promise<string> {
  const accountName = process.env.STORAGE_ACCOUNT!;
  const accountKey = process.env.STORAGE_KEY!;
  const containerName = process.env.STORAGE_CONTAINER || 'media';
  const blobName = `umstyling/generated/${uuidv4()}.png`;

  const cred = new StorageSharedKeyCredential(accountName, accountKey);
  const client = new BlobServiceClient(`https://${accountName}.blob.core.windows.net`, cred);
  const blockBlob = client.getContainerClient(containerName).getBlockBlobClient(blobName);

  await blockBlob.uploadData(buffer, {
    blobHTTPHeaders: { blobContentType: contentType },
  });

  return blockBlob.url;
}
