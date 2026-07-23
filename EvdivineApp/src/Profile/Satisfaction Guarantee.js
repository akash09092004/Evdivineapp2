import React from "react";
import ProfileInfoPage from "./components/ProfileInfoPage";

const sections = [
  {
    id: "1",
    title: "Our Commitment",
    icon: "shield-checkmark-outline",
    content:
      "At EvDivine, your spiritual journey and satisfaction are our highest priorities. We are committed to providing genuine, compassionate, and insightful astrology, tarot, psychic, numerology, Vastu, and spiritual guidance through experienced advisors who truly care about your well-being. Every consultation is intended to provide clarity, encouragement, and meaningful guidance while maintaining professionalism, respect, and confidentiality.",
  },
  {
    id: "2",
    title: "Our Promise to You",
    icon: "heart-outline",
    content:
      "We believe every reading should leave you feeling empowered, guided, and supported. If you are not satisfied with your experience, we are here to help make it right. Your journey matters to us, and we are committed to helping you find the clarity, confidence, and guidance you deserve through our platform and experienced advisors.",
  },
  {
    id: "3",
    title: "100% Client Satisfaction Commitment",
    icon: "star-outline",
    content:
      "If you believe your reading did not meet your expectations, you may contact our support team within 24 hours of your completed session. Our team will carefully review your concerns and work toward a fair resolution. Depending on the circumstances, EvDivine may offer one or more of the following options:\n\n• A complimentary follow-up session.\n• Credit toward another astrology or psychic advisor.\n• Assistance in matching you with a better-suited advisor.\n• Additional clarification or guidance regarding your consultation.\n\nAll requests are reviewed individually and handled fairly based on the details of the consultation.",
  },
  {
    id: "4",
    title: "Important Notes",
    icon: "information-circle-outline",
    content:
      "The Satisfaction Guarantee applies only to your most recent paid consultation. Requests must be submitted within 24 hours after your reading. The 5-Minute Connection Rule applies to live chat consultations. If you feel disconnected from your advisor during a live chat session, you should end the session within the first five (5) minutes to qualify for review. Refunds, credits, complimentary sessions, or other resolutions are provided solely at the discretion of EvDivine Management after reviewing the circumstances of each request.",
  },
  {
    id: "5",
    title: "Nature of Spiritual Services",
    icon: "sparkles-outline",
    content:
      "Astrology readings, tarot readings, psychic guidance, numerology, Vastu consultation, and all other spiritual services provided through EvDivine are intended for personal insight, spiritual guidance, self-reflection, and entertainment purposes only. Individual experiences, interpretations, advice, and outcomes may vary from person to person. EvDivine does not guarantee specific predictions, timelines, or future results, and users should exercise their own judgment before making important personal or professional decisions.",
  },
  {
    id: "6",
    title: "Limitations and Abuse Policy",
    icon: "warning-outline",
    content:
      "Abuse of the Satisfaction Guarantee Policy may result in restriction, suspension, or permanent removal of future access to EvDivine services. The Satisfaction Guarantee is limited to one (1) credited session per user per calendar month. Credits may apply to a maximum of five (5) minutes of chat time for a disputed session. EvDivine reserves the right to review consultation records, chat transcripts, call logs, booking history, payment records, and related information when evaluating a request. Requests may be denied if patterns of abuse, fraudulent behaviour, repeated unreasonable claims, chargeback threats, or misuse of the platform are detected.",
  },
  {
    id: "7",
    title: "Contact Us",
    icon: "mail-outline",
    content:
      "If you have any questions regarding this Satisfaction Guarantee or would like to request a review of your consultation, please contact our support team.\n\nEmail: contact@evdivine.com\nWebsite: https://evdivine.com\n\nPlease include your registered email address, booking details, consultation date, and a clear description of your concern so our team can review your request promptly.",
  },
];

export default function SatisfactionGuarantee({ navigation }) {
  return (
    <ProfileInfoPage
      navigation={navigation}
      title="Satisfaction Guarantee"
      subtitle="Your satisfaction and spiritual journey are important to us."
      icon="shield-checkmark-outline"
      pageKey="satisfaction-guarantee"
      sections={sections}
      footerTitle="We're Here to Help"
      footerText="If your consultation did not meet your expectations, please contact our support team within 24 hours. Every request is reviewed fairly to provide the best possible resolution."
    />
  );
}
