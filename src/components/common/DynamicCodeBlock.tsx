import React from "react";
import { CopyBlock, dracula } from "react-code-blocks";

export default function DynamicCodeBlock({ code, language }: { code: string; language: string }) {
  return (
    <CopyBlock
      text={code}
      language={language}
      showLineNumbers={false}
      codeBlock={true}
      theme={dracula}
    />
  );
}
