"use client";

import { useState } from "react";

export function ShareToolbar() {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="share-toolbar">
      <button type="button" className="share-toolbar-btn" onClick={() => void copyLink()}>
        {copied ? "복사됨" : "링크 복사"}
      </button>
      <button
        type="button"
        className="share-toolbar-btn"
        onClick={() => window.print()}
      >
        인쇄
      </button>
    </div>
  );
}
