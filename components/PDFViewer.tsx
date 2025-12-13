import React from "react";

type Props = {
  pdf_url: string;
};

const PDFViewer = ({ pdf_url }: Props) => {
  const validUrl = pdf_url.replace("https// ", "https://");

  return (
    <iframe
      src={`https://docs.google.com/gview?url=${validUrl}&embedded=true`}
      className="w-full h-full"
    />
  );
};

export default PDFViewer;
