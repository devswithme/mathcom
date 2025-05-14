"use client";

import Image from "next/image";
import React from "react";
import "katex/dist/katex.min.css";
import MarkdownRenderer from "../MarkdownRenderer";

interface PostBodyProps {
  title: string;
  description: string;
  imageURL?: string;
  descRef: (el: HTMLDivElement | null) => void;
  getPreviewHtml: (html: string) => string;
}

/**
 * PostBody Component with LaTeX support via Markdown.
 */
export default function PostBody({
  title,
  description,
  imageURL,
  descRef,
}: PostBodyProps) {
  return (
    <>
      <h1 className="text-lg font-bold mb-4">{title}</h1>

      <div ref={descRef} className="text-sm">
        <MarkdownRenderer content={description} />
      </div>

      {imageURL && (
        <div className="w-full aspect-video bg-neutral-100 rounded-xl my-5">
          <Image
            src={imageURL}
            alt="Uploaded image"
            width={800}
            height={400}
            className="w-full h-full object-cover rounded-xl"
          />
        </div>
      )}
    </>
  );
}
