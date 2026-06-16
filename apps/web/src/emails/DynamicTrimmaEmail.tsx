import { Button, Text } from "@react-email/components";
import * as React from "react";
import { TrimmaEmailLayout } from "./components/TrimmaEmailLayout";

export type DynamicTrimmaEmailProps = {
  preview: string;
  title: string;
  body: string;
  ctaLabel?: string;
  ctaUrl?: string;
};

export function DynamicTrimmaEmail({
  preview,
  title,
  body,
  ctaLabel,
  ctaUrl,
}: DynamicTrimmaEmailProps) {
  const paragraphs = body
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean);

  return (
    <TrimmaEmailLayout preview={preview} title={title}>
      {paragraphs.map((paragraph, index) => (
        <Text key={index} style={paragraphStyle}>
          {paragraph.split("\n").map((line, lineIndex, lines) => (
            <React.Fragment key={lineIndex}>
              {line}
              {lineIndex < lines.length - 1 ? <br /> : null}
            </React.Fragment>
          ))}
        </Text>
      ))}
      {ctaUrl && ctaLabel ? (
        <Button href={ctaUrl} style={buttonStyle}>
          {ctaLabel}
        </Button>
      ) : null}
    </TrimmaEmailLayout>
  );
}

const paragraphStyle: React.CSSProperties = {
  color: "#27272a",
  fontSize: "15px",
  lineHeight: "24px",
  margin: "0 0 16px",
  whiteSpace: "pre-wrap",
};

const buttonStyle: React.CSSProperties = {
  backgroundColor: "#ffc800",
  borderRadius: "12px",
  color: "#18181b",
  display: "inline-block",
  fontSize: "15px",
  fontWeight: 700,
  padding: "14px 24px",
  textDecoration: "none",
};
