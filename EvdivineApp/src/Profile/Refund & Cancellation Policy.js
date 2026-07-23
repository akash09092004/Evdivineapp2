import React from "react";
import ProfileInfoPage from "./components/ProfileInfoPage";

const sections = [
  {
    id: "1",
    title: "Policy Overview",
    icon: "information-circle-outline",
    content:
      "This Refund & Cancellation Policy explains when a booking can be cancelled, when a refund may be available, and how refund requests are handled on EvDivine. By booking any service on EvDivine, you agree to follow this policy along with the Terms & Conditions and other applicable policies.",
  },
  {
    id: "2",
    title: "Cancellation by User",
    icon: "close-circle-outline",
    content:
      "You may request cancellation of an upcoming booking before the consultation starts, subject to the timing and service rules shown at the time of booking. Once a consultation has started, cancellation may not be possible and the booking may be treated as completed or partially used.",
  },
  {
    id: "3",
    title: "Refund Eligibility",
    icon: "cash-outline",
    content:
      "Refunds may be considered for failed payments, duplicate payments, booking issues verified by our support team, or cancellations that qualify under the booking rules. Refund eligibility depends on the booking status, service type, payment method, and the stage at which the cancellation request was made.",
  },
  {
    id: "4",
    title: "Non-Refundable Cases",
    icon: "remove-circle-outline",
    content:
      "Refunds may not be available when a user joins late, misses the session, disconnects due to a personal network issue, cancels after the session has started, shares incomplete or incorrect booking details, or violates the platform rules. Promotional credits, bonus amounts, or special offer balances may also be non-refundable unless stated otherwise.",
  },
  {
    id: "5",
    title: "Refund Method and Time",
    icon: "time-outline",
    content:
      "Approved refunds are usually returned through the original payment method or credited to the EvDivine wallet, depending on the payment provider and internal processing rules. Processing time may vary based on the bank, card provider, wallet service, or payment gateway. Some refunds may take several working days to reflect in your account.",
  },
  {
    id: "6",
    title: "How to Request",
    icon: "chatbox-ellipses-outline",
    content:
      "To request a cancellation or refund, please contact EvDivine support with your booking details, payment reference, and a clear reason for the request. Our team may ask for additional information to verify the request before making a decision.",
  },
  {
    id: "7",
    title: "Contact Support",
    icon: "mail-outline",
    content:
      "If you have any questions about refunds or cancellations, please contact the EvDivine support team through the help or contact options available in the app.",
  },
];

export default function RefundCancellationPolicy({ navigation }) {
  return (
    <ProfileInfoPage
      navigation={navigation}
      title="Refund & Cancellation Policy"
      subtitle="Read how cancellations and refunds work for bookings on EvDivine."
      icon="refresh-circle-outline"
      pageKey="refund-cancellation-policy"
      sections={sections}
      footerTitle="Please review before booking"
      footerText="Refunds depend on booking status, timing, payment method, and support verification."
    />
  );
}
