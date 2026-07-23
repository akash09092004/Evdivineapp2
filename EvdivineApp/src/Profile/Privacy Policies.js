import React from "react";
import ProfileInfoPage from "./components/ProfileInfoPage";

const sections = [
  {
    id: "1",
    title: "Introduction",
    icon: "information-circle-outline",
    content:
      "Welcome to EvDivine. In this Privacy Policy, the terms “we”, “our”, and “us” refer to EvDivine. We respect your privacy and are committed to protecting your personal information. This Privacy Policy explains how we collect, use, store, process, share, and protect your information when you use our website, mobile application, consultations, digital products, payment services, or other EvDivine features. By accessing or using EvDivine services, you acknowledge that you have read and understood this Privacy Policy. If you do not agree with any part of this policy, please stop using our website, application, and services.",
  },
  {
    id: "2",
    title: "Information We Collect",
    icon: "person-outline",
    content:
      "We may collect information that you provide directly while creating an account, booking a consultation, contacting support, making a payment, or using EvDivine services.\n\nPersonal information may include:\n• Full name\n• Email address\n• Phone number or WhatsApp number\n• Billing address\n• Profile information\n• Booking and consultation details\n• Payment transaction references\n\nPayment information is processed securely through trusted third-party payment gateways. EvDivine does not sell or rent your personal information to third parties. We collect only the information that is reasonably required to provide services, maintain your account, process bookings, communicate with you, and fulfil legal or operational requirements.",
  },
  {
    id: "3",
    title: "Astrology and Spiritual Information",
    icon: "sparkles-outline",
    content:
      "To provide personalized astrology, numerology, tarot, vastu, psychic, horoscope, and spiritual consultation services, EvDivine may collect information voluntarily shared by you.\n\nThis information may include:\n• Date of birth\n• Time of birth\n• Place of birth\n• Horoscope or birth chart details\n• Zodiac or rashi information\n• Relationship details\n• Family-related information\n• Questions shared during consultations\n• Personal concerns or goals\n\nYou should provide only the information that is necessary for your consultation. Avoid sharing passwords, OTPs, complete banking details, government identification numbers, or other unrelated sensitive information. Astrology and spiritual information is used only to provide the requested consultation, personalized report, guidance, support, or related service.",
  },
  {
    id: "4",
    title: "Technical and Device Information",
    icon: "phone-portrait-outline",
    content:
      "When you access EvDivine through a website, mobile application, tablet, or other device, certain technical information may be collected automatically.\n\nThis information may include:\n• IP address\n• Device type and model\n• Operating system\n• Browser type\n• Application version\n• Approximate location\n• Language and timezone\n• Login and session information\n• Pages or features visited\n• Website and application usage data\n• Crash reports and technical error details\n\nWe may use cookies, local storage, analytics tools, security technologies, and similar systems to collect this information. Technical data helps us maintain security, diagnose errors, prevent fraud, improve performance, and provide a better experience across supported devices.",
  },
  {
    id: "5",
    title: "How We Use Your Information",
    icon: "analytics-outline",
    content:
      "EvDivine may use your information for legitimate service, security, operational, and legal purposes.\n\nWe may use your information to:\n• Create and manage your account\n• Provide astrology, tarot, numerology, vastu, psychic, and spiritual services\n• Prepare personalized reports and consultation guidance\n• Process bookings, payments, cancellations, and refunds\n• Send appointment confirmations and service notifications\n• Provide customer support\n• Improve our website, application, and user experience\n• Detect fraud, misuse, or illegal activity\n• Maintain internal records\n• Comply with legal obligations\n• Send promotional offers only where permitted or accepted by you\n\nWe do not use your information for unrelated purposes without appropriate notice or consent.",
  },
  {
    id: "6",
    title: "Payment Information",
    icon: "card-outline",
    content:
      "EvDivine may use trusted third-party payment gateways, including PayPal, Razorpay, or other approved providers, to process payments. We do not directly store your complete credit card number, debit card number, CVV, banking password, or similar confidential payment credentials. Payment information is entered and processed through the secure systems of the selected payment provider. EvDivine may receive limited payment-related information, such as transaction ID, order ID, payment status, amount, currency, payment method, refund status, and confirmation details. This information may be used to verify payments, confirm bookings, issue approved refunds, prevent fraud, maintain financial records, and resolve payment-related support requests.",
  },
  {
    id: "7",
    title: "Cookies and Similar Technologies",
    icon: "settings-outline",
    content:
      "EvDivine may use cookies and similar technologies, including browser storage, local storage, session storage, device storage, and analytics tools.\n\nThese technologies may be used to:\n• Keep users signed in\n• Maintain secure sessions\n• Remember user preferences\n• Improve website and application performance\n• Understand website traffic and feature usage\n• Support booking and payment processes\n• Detect errors and security risks\n• Provide a smoother user experience\n\nYou may manage, block, or delete cookies through your browser settings. However, disabling necessary cookies may affect login, booking, payment, or other essential features. EvDivine does not sell or rent information collected through cookies. Please review our separate Cookies Policy for further details.",
  },
  {
    id: "8",
    title: "Sharing of Information",
    icon: "share-social-outline",
    content:
      "EvDivine does not sell, rent, or commercially trade your personal information to third parties. We may share limited information only when reasonably necessary to provide services, maintain security, process payments, comply with law, or protect users.\n\nInformation may be shared with:\n• Payment gateway providers\n• Hosting and cloud service providers\n• Analytics and technical service providers\n• Customer support tools\n• Security and fraud-prevention providers\n• Professional advisers\n• Government or legal authorities when required by law\n\nService providers are expected to process information only for authorized purposes. We may also disclose information where necessary to protect EvDivine, our users, our legal rights, public safety, or to investigate suspected fraud or illegal activity.",
  },
  {
    id: "9",
    title: "Data Security",
    icon: "lock-closed-outline",
    content:
      "EvDivine uses reasonable administrative, technical, and organizational security measures to protect personal information against unauthorized access, misuse, alteration, disclosure, loss, or destruction. These measures may include secure connections, access controls, authentication systems, restricted database permissions, monitoring, encryption where appropriate, security updates, and trusted infrastructure providers. However, no website, application, server, internet connection, or electronic storage system can be guaranteed to be completely secure. Users are responsible for protecting their passwords, OTPs, devices, and account credentials. You should immediately contact EvDivine if you suspect unauthorized access or unusual account activity. EvDivine does not sell or rent personal information to third parties.",
  },
  {
    id: "10",
    title: "Your Privacy Rights",
    icon: "person-circle-outline",
    content:
      "Depending on applicable law and your location, you may have certain rights regarding your personal information.\n\nYou may request:\n• Access to personal information held about you\n• Correction of inaccurate or incomplete information\n• Deletion of eligible personal information\n• Restriction of certain processing activities\n• Withdrawal of previously provided consent\n• Information about how your data is used\n• Removal from promotional communications\n\nSome information may need to be retained for payment records, fraud prevention, dispute resolution, legal compliance, taxation, or security purposes. To submit a privacy request, contact us at contact@evdivine.com. We may request reasonable account verification before processing the request to protect your information from unauthorized access.",
  },
  {
    id: "11",
    title: "Third-Party Links and Services",
    icon: "open-outline",
    content:
      "The EvDivine website or application may contain links to third-party websites, payment providers, map services, social media platforms, embedded content, or external applications. These third parties operate independently and may have their own privacy policies, cookie policies, security practices, and terms of service. EvDivine does not control and is not responsible for how third-party websites or services collect, use, store, or share your information. Opening an external link or using a connected third-party service is done at your own discretion. Users are encouraged to review the privacy policy and terms of each third-party provider before sharing personal, payment, location, or account information.",
  },
  {
    id: "12",
    title: "Children’s Privacy",
    icon: "people-outline",
    content:
      "EvDivine services are intended for adults and are not designed for children under the age of 18. We do not knowingly collect personal information from minors without appropriate permission from a parent or legal guardian. Users must confirm that they are legally eligible to create an account, make payments, book consultations, and use EvDivine services. If we become aware that personal information belonging to a minor has been collected without proper authorization, we may delete or restrict that information after reasonable verification. Parents or legal guardians who believe that a minor has provided information to EvDivine may contact us at contact@evdivine.com.",
  },
  {
    id: "13",
    title: "Data Retention",
    icon: "time-outline",
    content:
      "EvDivine retains personal information only for as long as reasonably necessary to provide services, maintain accounts, process payments, resolve disputes, prevent fraud, comply with legal obligations, and support legitimate business requirements. Different categories of information may be retained for different periods. For example, booking and payment records may need to be retained longer than temporary session data. When information is no longer required, we may delete, anonymize, or securely restrict it, subject to applicable law and technical limitations. Account deletion does not always result in immediate deletion of every record where retention is required for financial, legal, security, fraud-prevention, or regulatory purposes.",
  },
  {
    id: "14",
    title: "Changes to This Privacy Policy",
    icon: "refresh-outline",
    content:
      "EvDivine may update this Privacy Policy from time to time to reflect changes in our services, technology, business practices, payment providers, security systems, or legal requirements. Updated versions will be published on this page with a revised effective or last-updated date. Where required, we may also provide notice through the website, mobile application, account notification, or email. Users are encouraged to review this Privacy Policy periodically. Continued use of EvDivine after an updated policy becomes effective means that the latest version will apply. If you do not agree with an updated policy, you should stop using the affected services and contact support regarding your account.",
  },
  {
    id: "15",
    title: "Contact Us",
    icon: "mail-outline",
    content:
      "If you have questions, concerns, complaints, or requests regarding this Privacy Policy or the handling of your personal information, you may contact EvDivine through the following details:\n\nEmail: contact@evdivine.com\nWebsite: https://evdivine.com\n\nWhen submitting a privacy-related request, please provide sufficient information to help us identify your account and understand your concern. Do not send passwords, OTPs, complete card details, CVV numbers, or banking passwords by email. We may request reasonable identity or account verification before responding to requests involving access, correction, or deletion of personal data. EvDivine will attempt to respond within a reasonable period, subject to applicable legal and operational requirements.",
  },
];

export default function PrivacyPolicies({ navigation }) {
  return (
    <ProfileInfoPage
      navigation={navigation}
      title="Privacy Policy"
      subtitle="Learn how EvDivine collects, uses, stores, and protects your information."
      icon="shield-checkmark-outline"
      pageKey="privacy-policies"
      sections={sections}
      footerTitle="Your privacy matters"
      footerText="EvDivine does not sell or rent your personal information. Contact us if you have questions about how your information is handled."
    />
  );
}
