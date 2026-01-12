import AWS from "aws-sdk";
import fs from "fs";
import path from "path";
import os from "os";

export async function downloadFromS3(file_key: string) {
  try {
    AWS.config.update({
      accessKeyId: process.env.NEXT_PUBLIC_AWS_S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.NEXT_PUBLIC_AWS_S3_SECRET_ACCESS_KEY,
    });
    const s3 = new AWS.S3({
      params: {
        Bucket: process.env.NEXT_PUBLIC_AWS_S3_BUCKET_NAME,
      },
      region: "ap-south-1",
    });
    const params = {
      Bucket: process.env.NEXT_PUBLIC_AWS_S3_BUCKET_NAME!,
      Key: file_key,
    };
    const object = await s3.getObject(params).promise();
    const tmpDir = os.tmpdir();
    const file_name = path.join(tmpDir, `pdf-${Date.now()}.pdf`);

    // Ensure the directory exists
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }

    fs.writeFileSync(file_name, object.Body as Buffer);
    return file_name;
  } catch (error) {
    console.error(error);
    return null;
  }
}

export async function deleteFromS3(file_key: string) {
  try {
    AWS.config.update({
      accessKeyId: process.env.NEXT_PUBLIC_AWS_S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.NEXT_PUBLIC_AWS_S3_SECRET_ACCESS_KEY,
    });
    const s3 = new AWS.S3({
      params: {
        Bucket: process.env.NEXT_PUBLIC_AWS_S3_BUCKET_NAME,
      },
      region: "ap-south-1",
    });
    const params = {
      Bucket: process.env.NEXT_PUBLIC_AWS_S3_BUCKET_NAME!,
      Key: file_key,
    };
    await s3.deleteObject(params).promise();
    return true;
  } catch (error) {
    console.error("Error deleting from S3:", error);
    return false;
  }
}
