import { apiFetch } from "@/lib/api";

export type NewsletterSource = "home" | "footer";

export type NewsletterSubscribeResult = {
  success: boolean;
  message: string;
  alreadySubscribed?: boolean;
};

export async function subscribeNewsletter(
  email: string,
  source: NewsletterSource = "home"
): Promise<NewsletterSubscribeResult> {
  return apiFetch<NewsletterSubscribeResult>("/v2/api/newsletter/subscribe", {
    method: "POST",
    body: JSON.stringify({ email, source }),
  });
}
