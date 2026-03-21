import OpenAI, { toFile } from 'openai';
import { v4 as uuidv4 } from 'uuid';
import { BlobServiceClient, StorageSharedKeyCredential } from '@azure/storage-blob';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

/**
 * Edit an existing image based on a style description.
 * Downloads the source image, sends it to OpenAI gpt-image-1 for editing,
 * uploads the result to Azure Blob Storage, and returns the public URL.
 */
export async function generateStyledImage(
  sourceImageUrl: string,
  stylePrompt: string,
): Promise<string> {
  // Download source image
  const imageResponse = await fetch(sourceImageUrl);
  if (!imageResponse.ok) throw new Error('Could not download source image');
  const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
  const contentType = imageResponse.headers.get('content-type') || 'image/png';
  const ext = contentType.includes('png') ? 'png' : 'jpg';

  // Call OpenAI image edit
  const result = await openai.images.edit({
    model: 'gpt-image-1',
    image: await toFile(imageBuffer, `source.${ext}`),
    prompt: stylePrompt,
    size: '1024x1024',
  });

  // Extract base64 image data
  const base64Data = result.data?.[0]?.b64_json;
  if (!base64Data) throw new Error('No image data returned from OpenAI');

  const generatedBuffer = Buffer.from(base64Data, 'base64');

  // Upload to Azure Blob Storage
  const publicUrl = await uploadToBlob(generatedBuffer, 'image/png');
  return publicUrl;
}

/**
 * Generate a new style image from a text description (no source image).
 * Used for proactive suggestions like "So könnte ein Frühlingsoutfit aussehen".
 */
export async function generateStyleImage(
  stylePrompt: string,
): Promise<string> {
  const result = await openai.images.generate({
    model: 'gpt-image-1',
    prompt: stylePrompt,
    size: '1024x1024',
  });

  const base64Data = result.data?.[0]?.b64_json;
  if (!base64Data) throw new Error('No image data returned from OpenAI');

  const generatedBuffer = Buffer.from(base64Data, 'base64');
  const publicUrl = await uploadToBlob(generatedBuffer, 'image/png');
  return publicUrl;
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
