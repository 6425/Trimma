import { Button, Text } from "@react-email/components";
import * as React from "react";
import { TrimmaEmailLayout } from "./components/TrimmaEmailLayout";

export type OwnerInviteEmailProps = {
  salonName: string;
  ownerEmail: string;
  activationUrl: string;
};

export function OwnerInviteEmail({
  salonName,
  ownerEmail,
  activationUrl,
}: OwnerInviteEmailProps) {
  return (
    <TrimmaEmailLayout
      preview={`Activate ${salonName} on Trimma`}
      title="Your salon is ready to join Trimma"
    >
      <Text style={paragraphStyle}>Hi there,</Text>
      <Text style={paragraphStyle}>
        Your salon <strong>{salonName}</strong> has been verified on Trimma. Sign in with{" "}
        <strong>{ownerEmail}</strong> to complete activation and start accepting bookings.
      </Text>
      <Button href={activationUrl} style={buttonStyle}>
        Activate my salon
      </Button>
      <Text style={mutedStyle}>
        If the button does not work, copy and paste this link into your browser:
        <br />
        {activationUrl}
      </Text>
    </TrimmaEmailLayout>
  );
}

const paragraphStyle: React.CSSProperties = {
  color: "#27272a",
  fontSize: "15px",
  lineHeight: "24px",
  margin: "0 0 16px",
};

const mutedStyle: React.CSSProperties = {
  color: "#71717a",
  fontSize: "13px",
  lineHeight: "20px",
  margin: "24px 0 0",
  wordBreak: "break-all",
};

const buttonStyle: React.CSSProperties = {
  backgroundColor: "#ffde5a",
  borderRadius: "12px",
  color: "#18181b",
  display: "inline-block",
  fontSize: "15px",
  fontWeight: 700,
  padding: "14px 24px",
  textDecoration: "none",
};
