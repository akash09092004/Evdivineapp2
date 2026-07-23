import React from "react";
import ProfileInfoPage from "./components/ProfileInfoPage";

const sections = [
  {
    id: "1",
    title: "Acceptance of Terms",
    icon: "checkmark-circle-outline",
    content:
      "By accessing, registering, or using EvDivine, you agree to follow these Terms and Conditions. These terms apply whenever you browse the application, create an account, book a consultation, use your wallet, communicate with an expert, or make a payment. If you do not agree with any part of these terms, you should stop using EvDivine services. Continued use of the application after any policy update means that you accept the revised terms. EvDivine may update these conditions when required to improve services, comply with laws, or protect users. Users are advised to review this page regularly.",
  },
  {
    id: "2",
    title: "User Account and Registration",
    icon: "person-add-outline",
    content:
      "Users may be required to create an account before booking consultations, making payments, or accessing selected EvDivine features. You must provide accurate, complete, and current information during registration. You are responsible for keeping your password, OTP, and account credentials private and secure. You must not share your account with another person or create an account using false information. Any activity completed through your account may be treated as your responsibility. If you notice unauthorized access or suspicious activity, contact EvDivine support immediately. Accounts created for fraud, impersonation, abuse, or illegal activity may be suspended or permanently terminated.",
  },
  {
    id: "3",
    title: "Booking and Appointment Rules",
    icon: "calendar-outline",
    content:
      "A consultation booking becomes valid only after successful payment, wallet deduction, or confirmation through an approved payment method. Users must carefully check the consultation type, selected date, time, duration, and other booking details before confirmation. The reserved slot may become unavailable to other users after confirmation. Users should join the consultation at the scheduled time with a working internet connection and compatible device. Joining late may reduce the available consultation time. Failure to join may be treated as a missed session. EvDivine may reschedule or cancel an appointment because of expert unavailability, maintenance, technical failure, or other unavoidable circumstances.",
  },
  {
    id: "4",
    title: "Payment Policy",
    icon: "card-outline",
    content:
      "Payments for EvDivine services may be processed through approved third-party payment gateways or through the user's available wallet balance. A booking is confirmed only after the payment is successfully verified. Failed, cancelled, pending, or incomplete transactions do not guarantee a consultation slot. Users must provide valid and authorized payment information. EvDivine is not responsible for delays caused by banks, card providers, payment gateways, internet problems, or incorrect payment details. Users should retain transaction receipts and booking confirmation details for future reference. Suspicious, unauthorized, or fraudulent payments may result in booking cancellation, account restrictions, investigation, or other appropriate action.",
  },
  {
    id: "5",
    title: "Wallet and Credit Balance",
    icon: "wallet-outline",
    content:
      "EvDivine may provide a digital wallet that allows users to add funds, receive approved refunds, promotional credits, or rewards, and make eligible payments inside the platform. Wallet balance can only be used for services supported by EvDivine and cannot be treated as a bank account. Promotional or bonus credits may have separate conditions, usage restrictions, or expiry periods. Users should review their balance and transaction history after every recharge or payment. Wallet funds cannot be transferred between accounts unless EvDivine specifically permits it. Fraud, unauthorized use, payment manipulation, or misuse of wallet benefits may lead to temporary restrictions or permanent account suspension.",
  },
  {
    id: "6",
    title: "Cancellation and Refund Policy",
    icon: "refresh-circle-outline",
    content:
      "Users may request cancellation or rescheduling according to the rules shown during booking. Refund eligibility depends on when the cancellation is requested, whether the consultation has started, the booking status, and the payment method used. A refund may not be available when a user joins late, misses the session, disconnects because of a personal network issue, or cancels after the consultation has started. Approved refunds may be returned through the original payment method or credited to the EvDivine wallet. Processing time may vary according to the payment provider or banking institution. Fraudulent, duplicate, or policy-violating refund requests may be rejected.",
  },
  {
    id: "7",
    title: "Consultation Guidance Only",
    icon: "sparkles-outline",
    content:
      "Astrology, tarot, numerology, vastu, spiritual readings, and related consultations available through EvDivine are provided only for personal guidance, reflection, and general informational purposes. These services do not replace professional medical, legal, financial, psychological, or emergency advice. Predictions and interpretations are based on traditional practices, information provided by users, and the personal experience of individual experts. EvDivine does not guarantee the accuracy of a prediction or any specific future result. Users remain responsible for their choices, actions, investments, health decisions, relationships, and other personal matters. Qualified professionals should always be consulted when specialized or regulated advice is required.",
  },
  {
    id: "8",
    title: "User Responsibilities",
    icon: "people-outline",
    content:
      "Users must behave respectfully while using EvDivine and while communicating with experts, support staff, or other users. Harassment, threats, abusive language, discrimination, fraud, spam, impersonation, illegal activity, or sharing inappropriate content is strictly prohibited. Users should provide correct information during consultations and must not intentionally mislead an expert. Consultation messages, audio, video, screenshots, or recordings must not be published or distributed without appropriate consent. Users are responsible for maintaining a safe device, internet connection, and account access. A violation may result in warnings, cancellation of services, removal of content, temporary suspension, permanent account termination, or legal action.",
  },
  {
    id: "9",
    title: "Privacy and Data Protection",
    icon: "shield-checkmark-outline",
    content:
      "EvDivine may collect information such as your name, phone number, email address, profile details, booking history, consultation records, device information, and transaction references to provide and improve services. Information is handled according to the applicable Privacy Policy and reasonable security practices. Payment credentials may be processed directly by secure third-party payment providers and may not be stored by EvDivine. Users should avoid sharing passwords, OTPs, banking details, or unnecessary sensitive information during consultations. Personal data may be disclosed when legally required, necessary for fraud prevention, or essential for providing a requested service. Users should review the Privacy Policy for complete details.",
  },
  {
    id: "10",
    title: "Intellectual Property and Content Usage",
    icon: "document-lock-outline",
    content:
      "All EvDivine trademarks, logos, application designs, layouts, graphics, icons, text, articles, videos, images, consultation materials, software, and other digital content belong to EvDivine or its authorized licensors. Users receive only a limited right to access the platform for lawful personal use. No content may be copied, modified, recorded, republished, distributed, sold, reverse engineered, or commercially exploited without written authorization. Users must not remove copyright notices, brand marks, or ownership information. Unauthorized use may lead to content removal, account suspension, claims for damages, or legal proceedings. Rights not expressly granted to users remain reserved by EvDivine and its licensors.",
  },
];

export default function TermsAndCondition({ navigation }) {
  return (
    <ProfileInfoPage
      navigation={navigation}
      title="Terms & Conditions"
      subtitle="Please read these rules carefully before using EvDivine services."
      icon="document-text-outline"
      pageKey="terms-and-conditions"
      sections={sections}
    />
  );
}
