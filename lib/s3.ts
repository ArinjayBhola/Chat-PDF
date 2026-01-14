import axios from "axios";

export async function uploadToS3(file: File) {
  try {
    const { data } = await axios.post("/api/upload-url", {
      file_name: file.name,
      file_type: file.type,
    });

    const { uploadUrl, file_key } = data;

    await axios.put(uploadUrl, file, {
      headers: {
        "Content-Type": file.type,
      },
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || file.size));
        console.log("uploading to s3...", percentCompleted + "%");
      },
    });

    return {
      file_key,
      file_name: file.name,
    };
  } catch (error) {
    console.error(error);
  }
}

export function getS3Url(file_key: string) {
  const url = `https://${process.env.NEXT_PUBLIC_AWS_S3_BUCKET_NAME}.s3.${process.env.NEXT_PUBLIC_AWS_REGION}.amazonaws.com/${file_key}`;
  return url;
}
