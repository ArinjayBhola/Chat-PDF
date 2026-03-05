import React from "react";

type Props = {
  file_url: string;
};

const DocViewer = ({ file_url }: Props) => {
  const validUrl = file_url.replace("https// ", "https://");

  return (
    <iframe
      src={`https://docs.google.com/gview?url=${validUrl}&embedded=true`}
      className="w-full h-full"
    />
  );
};

export default DocViewer;
