import React from "react";
import ProfileInfoPage from "./components/ProfileInfoPage";

const sections = [
  {
    id: "1",
    title: "Introduction",
    icon: "information-circle-outline",
    content:
      "The services provided on evdivine.com, including astrology consultations, tarot readings, psychic readings, numerology, Vastu guidance, spiritual healing guidance, horoscope predictions, and related content, are provided for spiritual guidance and entertainment purposes only. By accessing or using our website, mobile application, consultations, or related services, you acknowledge that you understand the nature of these services and agree to this Disclaimer. The information provided through EvDivine should not be treated as guaranteed facts, scientific conclusions, or professional advice.",
  },
  {
    id: "2",
    title: "Guarantee of Results",
    icon: "help-circle-outline",
    content:
      "All readings and guidance are based on spiritual interpretations, intuition, astrology calculations, traditional practices, and the experience of the consultant. Outcomes may vary for each individual.\n\n• We aim to provide high-quality insights but cannot guarantee the absolute accuracy or precision of all shared content.\n• We do not guarantee that predictions will come true because all services are provided for spiritual guidance and entertainment purposes.\n• Results may depend on personal decisions, changing circumstances, and external factors.\n• Readings and results are subjective and may vary according to each individual’s unique situation.",
  },
  {
    id: "3",
    title: "Not a Substitute for Professional Advice",
    icon: "document-text-outline",
    content:
      "EvDivine services are not a replacement for professional or regulated advice.\n\nOur services are not a substitute for:\n• Medical advice\n• Legal advice\n• Financial advice\n• Psychological therapy\n• Professional counselling\n\nIf you require professional assistance, you should consult a qualified doctor, lawyer, financial adviser, therapist, counsellor, or another certified professional. Spiritual guidance should only be used as an additional source of personal reflection and insight.",
  },
  {
    id: "4",
    title: "Personal Responsibility",
    icon: "person-outline",
    content:
      "You acknowledge and agree that any decision you make after receiving guidance from EvDivine consultants is entirely your own responsibility. You should use independent judgment before making important decisions related to relationships, health, career, education, property, business, finance, or personal life. EvDivine, evdivine.com, and its consultants are not responsible for any loss, damage, emotional distress, financial impact, relationship issue, disappointment, or other consequence arising from decisions or actions taken after using our website, consultations, reports, live chat, or related services.",
  },
  {
    id: "5",
    title: "Health and Emergency Disclaimer",
    icon: "warning-outline",
    content:
      "EvDivine does not diagnose, treat, cure, or prevent any disease, illness, medical condition, or mental health condition. Astrology, tarot readings, psychic readings, spiritual healing guidance, meditation guidance, or other EvDivine services must not replace medical examination, treatment, medication, or advice from a qualified healthcare professional. If you are experiencing a medical emergency, mental health crisis, self-harm risk, abuse, violence, or any urgent situation, immediately contact a qualified doctor, hospital, local emergency services, police, or an appropriate licensed professional. Do not rely on spiritual consultation alone during an emergency.",
  },
  {
    id: "6",
    title: "Service Usage Agreement",
    icon: "checkmark-circle-outline",
    content:
      "By purchasing, booking, accessing, or using any EvDivine service, you confirm that you are voluntarily seeking spiritual guidance and understand the nature of astrology consultations, tarot readings, psychic readings, numerology, Vastu guidance, horoscope predictions, spiritual healing guidance, and related services. You acknowledge that these services are subjective and are provided solely for spiritual guidance, reflection, and entertainment purposes. You agree not to treat any consultation, prediction, reading, or recommendation as a guaranteed result or professional instruction. Continued use of EvDivine means that you accept this Disclaimer and understand the limitations of the services.",
  },
  {
    id: "7",
    title: "Limitation of Liability",
    icon: "shield-outline",
    content:
      "To the maximum extent permitted by applicable law, evdivine.com, its owners, consultants, employees, affiliates, representatives, and service providers shall not be liable for any direct, indirect, incidental, special, emotional, financial, or consequential damages arising from the use of, inability to use, or reliance on our website, consultations, predictions, reports, live chat, digital content, or other services. This includes losses related to personal decisions, relationships, employment, business, investments, property, health, reputation, expectations, or third-party actions. Users access and use EvDivine services entirely at their own discretion and responsibility.",
  },
  {
    id: "8",
    title: "Contact Us",
    icon: "mail-outline",
    content:
      "If you have any questions, concerns, or requests regarding this Disclaimer, you may contact EvDivine using the details below.\n\nEmail: contact@evdivine.com\nWebsite: https://evdivine.com\n\nPlease do not send passwords, OTPs, complete card details, CVV numbers, banking passwords, or other confidential payment information by email.",
  },
];

export default function Disclaimer({ navigation }) {
  return (
    <ProfileInfoPage
      navigation={navigation}
      title="Disclaimer"
      subtitle="Please read this disclaimer carefully before using EvDivine services."
      icon="alert-circle-outline"
      pageKey="disclaimer"
      sections={sections}
      footerTitle="Spiritual Guidance Only"
      footerText="EvDivine provides spiritual guidance and entertainment services only. For medical, legal, financial, psychological, or emergency matters, please contact a qualified professional."
    />
  );
}
