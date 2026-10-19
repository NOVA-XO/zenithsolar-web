/* Builds a draft on this device. No network, storage, or automatic sending. */
export const CONTACT_EMAIL = "zenithsolar.contact@gmail.com";
export const SERVICE_LABELS = Object.freeze({
  external: "Гадна цахилгааны зураг төсөл",
  internal: "Барилгын цахилгаан хангамж",
  solar: "Нарны цахилгаан систем",
  lighting: "Гадна гэрэлтүүлэг",
  measurement: "Хэмжилт, зөвлөх үйлчилгээ",
  installation: "Угсралт, суурилуулалт",
  other: "Бусад / зөвлөлдөх",
});

export function buildEnquiry(input) {
  const service = Object.hasOwn(SERVICE_LABELS, input.service) ? SERVICE_LABELS[input.service] : "";
  const location = String(input.location ?? "").trim();
  const details = String(input.details ?? "").trim();
  const name = String(input.name ?? "").trim();
  const contact = String(input.contact ?? "").trim();
  if (!service) throw new Error("Хэрэгтэй үйлчилгээгээ сонгоно уу.");
  if (!location) throw new Error("Төслийн байршлыг бичнэ үү.");
  if (details.length < 10) throw new Error("Ажлынхаа талаар арай дэлгэрэнгүй бичнэ үү.");
  if (location.length > 160 || details.length > 2000 || name.length > 120 || contact.length > 160) {
    throw new Error("Талбарын зөвшөөрсөн уртад багтаан бичнэ үү.");
  }
  const subject = `Төслийн хүсэлт — ${service}`;
  const body = [
    `Үйлчилгээ: ${service}`,
    `Байршил: ${location}`,
    "",
    "Ажлын товч:",
    details,
    ...(name ? ["", `Нэр / байгууллага: ${name}`] : []),
    ...(contact ? [`Холбоо барих: ${contact}`] : []),
  ].join("\n");
  const mailto = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  return { subject, body, mailto, canOpenEmail: mailto.length <= 1800 };
}
