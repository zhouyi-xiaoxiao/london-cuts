// For the M-preview build, the landing page just forwards to /studio
// so the dashboard is the single entry surface. The scaffold's marketing
// landing (still in web/components/public-pages.tsx as `LandingPage`)
// is kept out of the router until M4 when it gets a proper re-skin.

import { redirect } from "next/navigation";

export default function Page() {
  redirect("/studio");
}
