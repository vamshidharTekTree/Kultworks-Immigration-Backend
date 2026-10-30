import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl }                          from '@aws-sdk/s3-request-presigner';
import { fromInstanceMetadata, fromSSO }         from '@aws-sdk/credential-providers';
import { awsCreds, env }                         from '../configs/env.config.js';

const SIGNED_URL_EXPIRY = 3600; // 1 hour

function buildClient() {
  return new S3Client({
    region:      awsCreds.region,
    credentials: env.local
      ? fromSSO({ profile: awsCreds.ssoProfile })
      : fromInstanceMetadata(),
  });
}

/**
 * Upload a file buffer to S3.
 * @param {string} folderPath   e.g. "immigration/orgId/caseId"
 * @param {string} fileName     e.g. "1234567890-passport.pdf"
 * @param {{ buffer: Buffer, mimetype: string }} file  multer memoryStorage file
 * @returns {{ storageKey: string, storageUrl: string }}
 */
export async function putFileToS3(folderPath, fileName, file) {
  const client = buildClient();
  const key    = `${folderPath}/${fileName}`;

  await client.send(new PutObjectCommand({
    Bucket:      awsCreds.bucket,
    Key:         key,
    Body:        file.buffer,
    ContentType: file.mimetype,
  }));

  return {
    storageKey: key,
    storageUrl: `https://${awsCreds.bucket}.s3.${awsCreds.region}.amazonaws.com/${key}`,
  };
}

/**
 * Generate a pre-signed GET URL (valid 1 hour).
 * @param {string}      key       S3 object key (storagePath on the CaseDocument)
 * @param {string|null} fileName  optional download filename for Content-Disposition
 * @returns {Promise<string>} presigned URL
 */
export async function getSignedFileUrl(key, fileName = null) {
  const client = buildClient();
  const params = { Bucket: awsCreds.bucket, Key: key };

  try {
    await client.send(new HeadObjectCommand(params));
  } catch (err) {
    if (err.name === 'NotFound')     throw new Error('File not found in S3');
    if (err.name === 'AccessDenied') throw new Error('Access denied to S3 file');
    throw new Error(`S3 head check failed: ${err.message}`);
  }

  return getSignedUrl(
    client,
    new GetObjectCommand({
      ...params,
      ...(fileName ? { ResponseContentDisposition: `attachment; filename="${fileName}"` } : {}),
    }),
    { expiresIn: SIGNED_URL_EXPIRY },
  );
}

/**
 * Delete a file from S3.
 * @param {string} key  S3 object key
 */
export async function deleteFileFromS3(key) {
  if (!key) throw new Error('S3 key is required');
  const client = buildClient();
  const params = { Bucket: awsCreds.bucket, Key: key };

  try {
    await client.send(new HeadObjectCommand(params));
    await client.send(new DeleteObjectCommand(params));
  } catch (err) {
    if (err.name === 'NotFound') throw new Error('File not found in S3');
    throw err;
  }
}

export { SIGNED_URL_EXPIRY };
