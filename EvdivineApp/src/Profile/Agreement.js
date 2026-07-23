import React from "react";
import ProfileInfoPage from "./components/ProfileInfoPage";

const sections = [
  {
    id: "1",
    title: "User responsibilities",
    icon: "person-outline",
    content:
      "Users must provide accurate personal details, use the app respectfully, and follow consultation timing, payment, and cancellation rules.",
  },
  {
    id: "2",
    title: "Service usage",
    icon: "phone-portrait-outline",
    content:
      "Services are for personal guidance and spiritual support. Please use the platform for lawful and appropriate purposes only.",
  },
  {
    id: "3",
    title: "Account safety",
    icon: "shield-checkmark-outline",
    content:
      "Keep your login credentials private. EvDivine is not responsible for loss caused by sharing your account details with others.",
  },
  {
    id: "4",
    title: "Agreement updates",
    icon: "create-outline",
    content:
      "We may update the agreement from time to time. Continued use of the app means you accept the latest version of these terms.",
  },
];

export default function Agreement({ navigation }) {
  return (
    <ProfileInfoPage
      navigation={navigation}
      title="Agreement"
      subtitle="The user agreement explains how the app should be used."
      icon="document-text-outline"
      pageKey="agreement"
      sections={sections}
    />
  );
}
