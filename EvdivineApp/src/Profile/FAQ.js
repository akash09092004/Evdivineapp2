import React from "react";
import ProfileInfoPage from "./components/ProfileInfoPage";

const sections = [
  {
    id: "1",
    title: "How do I book a consultation?",
    icon: "calendar-outline",
    content:
      "Open Services, choose your consultation type, select a time slot, and continue to booking. You can review all details before confirming.",
  },
  {
    id: "2",
    title: "Can I cancel or reschedule?",
    icon: "refresh-outline",
    content:
      "Yes, upcoming bookings can be cancelled or rescheduled from the My Booking page depending on the service timing and availability.",
  },
  {
    id: "3",
    title: "What payment methods are supported?",
    icon: "card-outline",
    content:
      "We support UPI, wallet, card, and net banking options depending on the payment gateway available in your device and region.",
  },
  {
    id: "4",
    title: "What if my payment fails?",
    icon: "alert-circle-outline",
    content:
      "If payment is deducted but booking is not confirmed, keep your receipt and contact support. The team will verify the transaction and help you.",
  },
];

export default function FAQ({ navigation }) {
  return (
    <ProfileInfoPage
      navigation={navigation}
      title="FAQ"
      subtitle="Quick answers to common questions about booking and support."
      icon="help-circle-outline"
      pageKey="faq"
      sections={sections}
    />
  );
}
