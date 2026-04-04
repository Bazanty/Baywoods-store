import { v2 as cloudinary } from "cloudinary";

function getConfig() {
  const cloud_name = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const api_key    = process.env.CLOUDINARY_API_KEY?.trim();
  const api_secret = process.env.CLOUDINARY_API_SECRET?.trim();

  if (!cloud_name) throw new Error("Missing env var: CLOUDINARY_CLOUD_NAME");
  if (!api_key)    throw new Error("Missing env var: CLOUDINARY_API_KEY");
  if (!api_secret) throw new Error("Missing env var: CLOUDINARY_API_SECRET");

  return { cloud_name, api_key, api_secret };
}

export async function uploadImage(
  fileBuffer: Buffer,
  folder = "baywoods/products"
): Promise<{ url: string; publicId: string; width: number; height: number }> {
  cloudinary.config({ ...getConfig(), secure: true });

  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream({ folder, resource_type: "image" }, (err, result) => {
        if (err || !result) return reject(err ?? new Error("Upload failed"));
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          width: result.width,
          height: result.height,
        });
      })
      .end(fileBuffer);
  });
}

export async function deleteImage(publicId: string): Promise<void> {
  cloudinary.config({ ...getConfig(), secure: true });
  await cloudinary.uploader.destroy(publicId);
}
