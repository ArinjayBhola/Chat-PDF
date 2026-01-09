"use client";

import { uploadToS3 } from "@/lib/s3";
import { useMutation } from "@tanstack/react-query";
import React, { useState } from "react";
import { useDropzone } from "react-dropzone";
import axios from "axios";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { FaInbox } from "react-icons/fa";
import { RiLoader2Fill } from "react-icons/ri";

type Props = {
  isPro: boolean;
  chatCount: number;
};

const FileUpload = ({ isPro, chatCount }: Props) => {
  const [uploading, setUploading] = useState(false);
  const router = useRouter();

  const { mutate, isPending } = useMutation({
    mutationFn: async ({ file_key, file_name }: { file_key: string; file_name: string }) => {
      const response = await axios.post("/api/create-chat", {
        file_key,
        file_name,
      });
      return response.data;
    },
  });

  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      "application/pdf": [".pdf"],
    },
    maxFiles: 1,
    onDrop: async (acceptedFiles) => {
      const file = acceptedFiles[0];
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size should be less than 10MB");
        return;
      }
      try {
        setUploading(true);
        const data = await uploadToS3(file);
        if (!data?.file_key || !data?.file_name) {
          toast.error("Something went wrong");
          return;
        }
        mutate(data, {
          onSuccess: ({ chat_id }) => {
            toast.success("Chat Created");
            router.push(`/chat/${chat_id}`);
          },
          onError: (error: any) => {
            if (error.response?.status === 403) {
                toast.error("Free limit reached! Upgrade to Pro to upload more.");
            } else {
                toast.error("Error creating chat");
            }
            console.error(error);
          },
        });
      } catch (error) {
        console.log(error);
      } finally {
        setUploading(false);
      }
    },
  });

  // Check upload limit
  const isFreeLimitReached = !isPro && chatCount >= 3;

  return (
    <div className="w-full">
      <div
        {...(isFreeLimitReached ? {} : getRootProps())}
        className={`group relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed py-10 transition-all 
          ${isFreeLimitReached 
            ? "border-slate-300 bg-slate-50 cursor-default" 
            : "border-slate-300 bg-slate-50 hover:border-blue-400 hover:bg-blue-50/30 cursor-pointer"
          }`}
      >
        {!isFreeLimitReached && <input {...getInputProps()} />}
        
        {uploading || isPending ? (
          <div className="flex flex-col items-center">
            <RiLoader2Fill className="h-10 w-10 text-blue-600 animate-spin" />
            <p className="mt-4 text-sm font-medium text-slate-600">Processing your PDF...</p>
          </div>
        ) : isFreeLimitReached ? (
           <div className="flex flex-col items-center">
            <div className="rounded-full bg-slate-100 p-4 shadow-sm border border-slate-200">
               <FaInbox className="h-8 w-8 text-slate-400" />
            </div>
            <p className="mt-4 text-sm font-semibold text-slate-900">Free limit reached</p>
            <p className="mt-1 text-xs text-slate-500 max-w-[200px] text-center mb-4">You can only upload 3 PDFs on the free plan.</p>
            
            <p className="text-sm font-medium text-blue-600 hover:text-blue-500 hover:underline">
                Upgrade to upload more
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="rounded-full bg-white p-4 shadow-md border border-slate-200 transition-transform group-hover:scale-110 group-hover:shadow-lg">
              <FaInbox className="h-8 w-8 text-blue-600" />
            </div>
            <p className="mt-4 text-sm font-semibold text-slate-900">Drop PDF here</p>
            <p className="mt-1 text-xs text-slate-500">PDF up to 10MB</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUpload;
