import { Button, Text } from "@react-email/components";
import * as React from "react";
import { TrimmaEmailLayout } from "./components/TrimmaEmailLayout";

export type BookingConfirmationEmailProps = {
  customerName: string;
  bookingNo: string;
  salonName: string;
  serviceName: string;
  bookingDate: string;
  bookingTime: string;
  reservationFee: string;
  dashboardUrl: string;
};

export function BookingConfirmationEmail({
  customerName,
  bookingNo,
  salonName,
  serviceName,
  bookingDate,
  bookingTime,
  reservationFee,
  dashboardUrl,
}: BookingConfirmationEmailProps) {
  return (
    <TrimmaEmailLayout
      preview={`Booking confirmed · ${bookingNo}`}
      title="Your appointment is confirmed"
    >
      <Text style={paragraphStyle}>Hi {customerName},</Text>
      <Text style={paragraphStyle}>
        Your reservation at <strong>{salonName}</strong> is confirmed. Here are your booking
        details:
      </Text>
      <Text style={detailBoxStyle}>
        <strong>Reference:</strong> {bookingNo}
        <br />
        <strong>Service:</strong> {serviceName}
        <br />
        <strong>Date:</strong> {bookingDate}
        <br />
        <strong>Time:</strong> {bookingTime}
        <br />
        <strong>Reservation deposit paid:</strong> {reservationFee}
      </Text>
      <Text style={paragraphStyle}>
        The online reservation deposit is non-refundable. Contact the salon directly if you need
        to reschedule.
      </Text>
      <Button href={dashboardUrl} style={buttonStyle}>
        View my bookings
      </Button>
    </TrimmaEmailLayout>
  );
}

const paragraphStyle: React.CSSProperties = {
  color: "#27272a",
  fontSize: "15px",
  lineHeight: "24px",
  margin: "0 0 16px",
};

const detailBoxStyle: React.CSSProperties = {
  backgroundColor: "#fafafa",
  border: "1px solid #e4e4e7",
  borderRadius: "12px",
  color: "#27272a",
  fontSize: "14px",
  lineHeight: "22px",
  margin: "0 0 16px",
  padding: "16px",
};

const buttonStyle: React.CSSProperties = {
  backgroundColor: "#F5B700",
  borderRadius: "12px",
  color: "#18181b",
  display: "inline-block",
  fontSize: "15px",
  fontWeight: 700,
  padding: "14px 24px",
  textDecoration: "none",
};
