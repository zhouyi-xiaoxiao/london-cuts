import { redirect } from "next/navigation";

import { AuthRequiredError, OnboardingRequiredError } from "@/lib/errors";
import { requireOnboardedUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    await requireOnboardedUser();
  } catch (err) {
    if (err instanceof OnboardingRequiredError) {
      redirect("/onboarding");
    }
    if (err instanceof AuthRequiredError) {
      redirect("/sign-in?next=/studio");
    }
    throw err;
  }

  return children;
}
