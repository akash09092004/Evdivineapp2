import React from "react";
import ProfileInfoPage from "./components/ProfileInfoPage";

const sections = [
  {
    id: "1",
    title: "Introduction",
    icon: "information-circle-outline",
    content:
      "This Cookie Policy explains how EvDivine, referred to as “we”, “our”, or “us”, uses cookies and similar tracking technologies on our website, https://evdivine.com. Cookies help us operate the website, remember user preferences, protect accounts, understand website activity, and improve the overall experience. By accessing or using our website, you agree to the use of cookies as described in this policy. If you do not agree with the use of cookies or any part of this policy, you should change your browser settings, disable cookies where possible, or stop using the affected EvDivine services.",
  },
  {
    id: "2",
    title: "What Are Cookies?",
    icon: "document-text-outline",
    content:
      "Cookies are small text files stored on your computer, mobile phone, tablet, browser, or another supported device when you visit a website. They allow websites to remember information about your visit and help important features work properly. Cookies may remember whether you are signed in, your selected language, saved preferences, and activities completed during a browsing session. They may also help improve website performance, security, and usability. EvDivine may use cookies together with similar technologies, such as local storage, session storage, tracking pixels, tags, and software development kits, depending on the services and features available on the website.",
  },
  {
    id: "3",
    title: "Why We Use Cookies",
    icon: "speedometer-outline",
    content:
      "EvDivine uses cookies and similar technologies to provide a secure, reliable, and convenient website experience.\n\nWe may use cookies to:\n• Improve website performance and loading speed\n• Remember user login sessions and preferences\n• Understand user activity and browsing behaviour\n• Provide a better customer experience\n• Track website traffic and analytics\n• Detect technical errors and improve services\n• Prevent fraud and unauthorized access\n• Maintain secure booking and payment sessions\n• Measure marketing and advertising effectiveness\n\nWe do not use cookies to access unrelated personal files stored on your device. The cookies used may depend on the features and integrations currently active on EvDivine.",
  },
  {
    id: "4",
    title: "Types of Cookies We Use",
    icon: "layers-outline",
    content:
      "EvDivine may use different categories of cookies depending on the purpose for which they are required.\n\nA) Essential Cookies\nThese cookies are necessary for basic website functionality, including login access, secure navigation, account authentication, booking sessions, and payment processing.\n\nB) Performance and Analytics Cookies\nThese cookies help us understand website traffic, visitor behaviour, loading performance, and technical issues. Tools may include Google Analytics or similar services when they are active.\n\nC) Functional Cookies\nThese cookies remember preferences such as language, selected settings, saved details, and customized browsing choices.\n\nD) Advertising and Marketing Cookies\nThese cookies may support advertising and campaign measurement on platforms such as Google, Facebook, or Instagram when these tools are enabled.",
  },
  {
    id: "5",
    title: "Third-Party Cookies",
    icon: "share-social-outline",
    content:
      "EvDivine may allow trusted third-party service providers to place or access cookies when users interact with services connected to our website. These providers may include payment gateways, analytics services, advertising platforms, hosting providers, security tools, map services, and social media platforms. Third-party cookies may be used for transaction processing, fraud prevention, analytics, advertising measurement, security, or service functionality. These cookies are controlled by the relevant third-party provider and are governed by that provider’s privacy policy and cookie policy. EvDivine does not directly control every third-party cookie. Users should review the policies of each external service before using its connected or embedded features.",
  },
  {
    id: "6",
    title: "How to Control Cookies",
    icon: "settings-outline",
    content:
      "You can control, block, or delete cookies at any time through your browser settings. Most browsers, including Chrome, Safari, Firefox, Edge, and other modern browsers, allow users to review stored cookies, block selected cookies, clear browsing data, or disable cookies completely. Where available, EvDivine may also provide options such as Accept All, Reject Optional, or Cookie Settings. However, disabling essential cookies may affect website performance and may prevent some features from working correctly. Login, account security, bookings, payments, saved preferences, and protected pages may not function properly when necessary cookies are blocked. Browser instructions may vary depending on your device and browser version.",
  },
  {
    id: "7",
    title: "Updates to This Cookie Policy",
    icon: "refresh-outline",
    content:
      "EvDivine may update this Cookie Policy at any time to reflect changes in our website, services, technologies, analytics tools, advertising platforms, payment providers, security practices, or legal requirements. Any changes will be published on this page and may become effective immediately or from the updated effective date displayed with the policy. Users are encouraged to review this Cookie Policy periodically to remain informed about how cookies and similar technologies are used. Continued use of the EvDivine website after an updated policy is published means that the latest version will apply. EvDivine does not sell or rent personal information collected through cookies to third parties.",
  },
  {
    id: "8",
    title: "Contact Us",
    icon: "mail-outline",
    content:
      "If you have any questions, concerns, or requests regarding this Cookie Policy or the way EvDivine uses cookies and similar tracking technologies, you may contact us using the information provided below.\n\nEmail: contact@evdivine.com\nWebsite: https://evdivine.com\n\nWhen contacting us, please provide enough information to help us understand your question or concern. Do not send passwords, OTPs, complete credit or debit card numbers, CVV details, banking passwords, or other confidential payment credentials by email. You may also manage your cookie preferences directly through your browser settings or through any cookie preference controls made available on the EvDivine website.",
  },
];

export default function CookiesPolicy({ navigation }) {
  return (
    <ProfileInfoPage
      navigation={navigation}
      title="Cookie Policy"
      subtitle="Learn how EvDivine uses cookies and similar tracking technologies."
      icon="shield-checkmark-outline"
      pageKey="cookies-policy"
      sections={sections}
      footerTitle="Your cookie choices matter"
      footerText="You can control or delete cookies through your browser settings. Disabling essential cookies may affect login, bookings, payments, and other website features."
    />
  );
}
