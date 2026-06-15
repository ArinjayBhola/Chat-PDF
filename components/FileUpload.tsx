// UI REDESIGN
"use client";

import { uploadToS3 } from "@/lib/s3";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import React, { useState } from "react";
import { useDropzone } from "react-dropzone";
import axios from "axios";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { FaInbox } from "react-icons/fa";

type Props = {
  isPro: boolean;
  chatCount: number;
  children?: ({ isUploading }: { isUploading: boolean }) => React.ReactNode;
};

const FileUpload = ({ isPro, chatCount, children }: Props) => {
  const [uploading, setUploading] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();

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
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "application/vnd.openxmlformats-officedocument.presentationml.presentation": [".pptx"],
      "text/plain": [".txt"],
      "text/markdown": [".md"],
      "text/csv": [".csv"],
      "application/json": [".json"],
      "image/png": [".png"],
      "image/jpeg": [".jpg", ".jpeg"],
      "image/gif": [".gif"],
      "image/webp": [".webp"],
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
            queryClient.invalidateQueries({ queryKey: ["chats-list"] });
            router.push(`/chat/${chat_id}`);
          },
          onError: (error: unknown) => {
            const axiosError = error as { response?: { status: number } };
            if (axiosError.response?.status === 403) {
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
  const isUploading = uploading || isPending;

  if (children) {
    return (
      <div {...getRootProps()} className="w-full">
        {!isFreeLimitReached && <input {...getInputProps()} />}
        {children({ isUploading })}
      </div>
    );
  }

  return (
    <div className="w-full">
      <div
        {...(isFreeLimitReached || isUploading ? {} : getRootProps())}
        className={`group relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed py-10 transition-all duration-200
          ${
            isFreeLimitReached || isUploading
              ? "border-border bg-muted/20 cursor-default"
              : "border-border bg-muted/20 hover:border-primary/50 hover:bg-primary/[0.02] cursor-pointer"
          }`}>
        {!(isFreeLimitReached || isUploading) && <input {...getInputProps()} />}

        {isUploading ? (
          <div className="flex flex-col items-center animate-in fade-in duration-300">
            <div className="relative flex h-10 w-10">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/30 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-10 w-10 bg-primary/20 flex items-center justify-center border border-primary/40">
                <span className="w-3.5 h-3.5 bg-primary rounded-full animate-pulse" />
              </span>
            </div>
            <p className="mt-4 text-sm font-semibold text-foreground">Processing your file...</p>
            <p className="mt-1 text-xs text-muted-foreground">Uploading to secure storage...</p>
          </div>
        ) : isFreeLimitReached ? (
          <div className="flex flex-col items-center">
            <div className="rounded-full bg-muted p-4 shadow-sm border border-border">
              <FaInbox className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="mt-4 text-sm font-bold text-foreground">Free limit reached</p>
            <p className="mt-1 text-xs text-muted-foreground max-w-[200px] text-center mb-4">
              You can only upload 3 files on the free plan.
            </p>
            <p className="text-sm font-semibold text-primary hover:text-primary/80 hover:underline transition-colors">
              Upgrade to upload more
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="rounded-full bg-background p-4 shadow-sm border border-border transition-all duration-200 group-hover:scale-105 group-hover:shadow group-hover:border-primary/30">
              <FaInbox className="h-8 w-8 text-primary" />
            </div>
            <p className="mt-4 text-sm font-bold text-foreground">Drop file here</p>
            <p className="mt-1 text-xs text-muted-foreground">PDF, DOCX, TXT, images & more (up to 10MB)</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUpload;
