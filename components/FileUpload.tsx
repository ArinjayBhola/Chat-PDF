"use client";

import { Inbox } from "lucide-react";
import React from "react";
import { useDropzone } from "react-dropzone";

const FileUpload = () => {
  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      "application/pdf": [".pdf"],
    },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      console.log(acceptedFiles);
    },
  });
  return (
    <div className="p-2 bg-white rounded-xl">
      <div
        {...getRootProps({
          className:
            "border-2 border-dashed border-gray-50 rounded-xl py-8 cursor-pointer hover:bg-gray-100 flex justify-center items-center flex-col",
        })}>
        <input {...getInputProps()} />
        <>
          <Inbox className="w-10 h-10 text-blue-500" />
          <p className="m-2 text-md text-slate-400">Drop PDF here</p>
        </>
      </div>
    </div>
  );
};

export default FileUpload;
