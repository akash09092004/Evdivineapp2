import { API_BASE_URL } from "../config/api";

export const submitContactMessage = async (payload) => {
  const response = await fetch(`${API_BASE_URL}/api/content/contact-messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: String(payload?.name || "").trim(),
      email: String(payload?.email || "").trim(),
      phone: String(payload?.phone || "").trim(),
      subject: String(payload?.subject || "").trim(),
      message: String(payload?.message || "").trim(),
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.message || "Unable to send message");
  }

  return data;
};
