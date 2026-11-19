export const WHATSAPP_DISPLAY = '+234 8077780074';
export const WHATSAPP_E164 = '2348077780074';

export function buildWhatsAppUrl(message: string): string {
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${WHATSAPP_E164}?text=${encoded}`;
}

export function buildHireWhatsAppUrl(serviceName?: string): string {
  if (!serviceName) {
    return buildWhatsAppUrl(
      'Hello BossAdoly Digital Hub! I would like to hire you for my brand. Please share your availability and next steps.'
    );
  }
  return buildWhatsAppUrl(
    `Hello BossAdoly Digital Hub! I want to hire you for: ${serviceName}. Let's discuss how to get started.`
  );
}

export interface PricingInquiryPayload {
  name: string;
  service: string;
  duration: string;
  budget: string;
  goal: string;
}

export function buildPricingInquiryMessage(payload: PricingInquiryPayload): string {
  return [
    'Hello BossAdoly Digital Hub, I would like to book a service:',
    '',
    `Name: ${payload.name}`,
    `Service Needed: ${payload.service}`,
    `Duration: ${payload.duration}`,
    `Budget: ${payload.budget}`,
    `Goal: ${payload.goal}`,
    '',
    'Please let me know the next steps to begin.',
  ].join('\n');
}
