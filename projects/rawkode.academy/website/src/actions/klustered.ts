import process from "node:process";
import { ActionError, defineAction } from "astro:actions";
import { getSecret } from "astro:env/server";
import { z } from "astro:schema";
import { Resend } from "resend";

const SignupSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export const signupForKlustered = defineAction({
  input: SignupSchema,
  accept: "form",
  handler: async (data, _ctx) => {
    const { email } = data;

    const resendApiKey = getSecret("RESEND_API_KEY") ||
      process.env.RESEND_API_KEY;
    const audienceId = "e645ad5b-95d4-48ef-9c4e-1ad0e2b7a290";

    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured");

      throw new ActionError({
        code: "INTERNAL_SERVER_ERROR",
        message: "An error occurred while processing your request",
      });
    }

    try {
      const resend = new Resend(resendApiKey);

      await resend.contacts.create({
        email: email,
        unsubscribed: false,
        audienceId: audienceId,
      });
    } catch (resendError) {
      console.error("Error adding contact to Resend:", resendError);
      throw new ActionError({
        code: "INTERNAL_SERVER_ERROR",
        message: "An error occurred while processing your request",
      });
    }

    return {
      success: true,
      message:
        "Thank you for signing up! We'll notify you when the new season begins.",
    };
  },
});
