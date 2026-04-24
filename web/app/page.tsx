// After the preview-password gate was retired, `/` became the shareable
// public entry. Until M4 ships a proper landing page, send visitors to
// the strongest public reader demo.

import { redirect } from "next/navigation";

export default function Page() {
  redirect("/@ana-ishii/a-year-in-se1");
}
