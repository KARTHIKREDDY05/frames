import crypto from "node:crypto";
import { env } from "../runtime/env.js";

export interface PresignedUpload {
  uploadUrl: string;
  mediaUrl: string;
  fields?: Record<string, string>;
}

export class MediaStorageService {
  async createUploadUrl(userId: string, mimeType: string): Promise<PresignedUpload> {
    const extension = mimeType.includes("video") ? "mp4" : "jpg";
    const key = `uploads/${userId}/${crypto.randomUUID()}.${extension}`;
    if (env.DEMO_MODE) {
      return {
        uploadUrl: `${env.CDN_URL}/demo-upload/${key}`,
        mediaUrl: `${env.CDN_URL}/${key}`
      };
    }
    return {
      uploadUrl: `s3://${env.AWS_BUCKET_NAME}/${key}`,
      mediaUrl: `${env.CDN_URL}/${key}`
    };
  }
}
