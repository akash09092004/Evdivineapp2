import React from "react";
import ProfileInfoPage from "./components/ProfileInfoPage";

const sections = [
  {
    id: "1",
    title: "Advisor Eligibility",
    icon: "person-circle-outline",
    content:
      "Advisors must provide accurate identity details, maintain an active profile, and complete any verification steps required by EvDivine before offering consultations.",
  },
  {
    id: "2",
    title: "Professional Conduct",
    icon: "shield-checkmark-outline",
    content:
      "Advisors must behave respectfully with users, support staff, and the platform. Misleading statements, abusive language, harassment, spam, or misuse of user trust is not allowed.",
  },
  {
    id: "3",
    title: "Service Standards",
    icon: "document-text-outline",
    content:
      "Advisors should deliver consultations honestly, stay available during accepted session times, and avoid unnecessary delays or interruptions that affect the user experience.",
  },
  {
    id: "4",
    title: "Confidentiality",
    icon: "lock-closed-outline",
    content:
      "All user information shared during consultations should be treated as confidential unless disclosure is required by law or by a platform safety rule.",
  },
  {
    id: "5",
    title: "Account Responsibility",
    icon: "key-outline",
    content:
      "Advisors are responsible for maintaining the security of their login credentials, device access, and any communication linked to their account.",
  },
  {
    id: "6",
    title: "Payments and Wallet",
    icon: "wallet-outline",
    content:
      "Any earnings, refunds, deductions, or settlement rules are subject to the platform policy and any applicable agreement between the advisor and EvDivine.",
  },
  {
    id: "7",
    title: "Policy Updates",
    icon: "refresh-outline",
    content:
      "EvDivine may update advisor terms when needed for safety, legal compliance, service quality, or operational reasons. Continued use of the advisor platform means the updated terms apply.",
  },
];

export default function AdvisorTermsCondition({ navigation }) {
  return (
    <ProfileInfoPage
      navigation={navigation}
      title="Advisor Terms & Conditions"
      subtitle="Rules and responsibilities for advisors on EvDivine."
      icon="person-circle-outline"
      pageKey="advisor-terms-and-conditions"
      sections={sections}
    />
  );
}
