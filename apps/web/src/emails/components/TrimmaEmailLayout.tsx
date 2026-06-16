import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

type TrimmaEmailLayoutProps = {
  preview: string;
  title: string;
  children: React.ReactNode;
};

export function TrimmaEmailLayout({ preview, title, children }: TrimmaEmailLayoutProps) {
  return (
    <Html lang="en">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <Section style={headerStyle}>
            <Text style={brandStyle}>Trimma</Text>
            <Text style={titleStyle}>{title}</Text>
          </Section>
          <Section style={contentStyle}>{children}</Section>
          <Hr style={hrStyle} />
          <Text style={footerStyle}>
            © {new Date().getFullYear()} Trimma · trimma.io
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const bodyStyle: React.CSSProperties = {
  backgroundColor: "#f4f4f5",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  margin: 0,
  padding: "24px 0",
};

const containerStyle: React.CSSProperties = {
  backgroundColor: "#ffffff",
  borderRadius: "16px",
  margin: "0 auto",
  maxWidth: "560px",
  overflow: "hidden",
  border: "1px solid #e4e4e7",
};

const headerStyle: React.CSSProperties = {
  backgroundColor: "#18181b",
  padding: "24px 32px",
};

const brandStyle: React.CSSProperties = {
  color: "#ffc800",
  fontSize: "14px",
  fontWeight: 700,
  letterSpacing: "0.08em",
  margin: "0 0 8px",
  textTransform: "uppercase",
};

const titleStyle: React.CSSProperties = {
  color: "#ffffff",
  fontSize: "22px",
  fontWeight: 700,
  lineHeight: "1.3",
  margin: 0,
};

const contentStyle: React.CSSProperties = {
  padding: "32px",
};

const hrStyle: React.CSSProperties = {
  borderColor: "#e4e4e7",
  margin: "0 32px",
};

const footerStyle: React.CSSProperties = {
  color: "#71717a",
  fontSize: "12px",
  lineHeight: "20px",
  padding: "16px 32px 24px",
  textAlign: "center",
};
