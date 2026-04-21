// F-T009 — public project reader view smoke tests.
// Verifies the public project page renders the seed (SE1) project title,
// emits one card per seed stop, and that clicking a card doesn't crash
// (we mock next/navigation because the public page uses router.push
// on the atlas click handler; the card itself is a real <Link> and
// only needs to be clickable without throwing).
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ─── next/navigation mock ─────────────────────────────────────────────
// The public project page imports `useRouter` to jump to a chapter
// when a pin is clicked on the atlas. Next doesn't expose a router
// in vitest-jsdom, so stub it — the public stop cards render a real
// <Link>, which Next hydrates into an <a>, and the fireEvent click
// just bubbles up like any anchor click.
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

// ─── maplibre-gl mock (see atlas.test.tsx for the detailed reasoning) ─
// The atlas runs a dynamic `import("maplibre-gl")`. jsdom has no WebGL
// and we don't want network hits to basemaps.cartocdn.com, so return a
// faked module. The public project page renders <Atlas> so this mock
// MUST be in place before the component mounts.
class FakeMarker {
  element: HTMLElement;
  constructor(opts: { element?: HTMLElement }) {
    this.element = opts?.element ?? document.createElement("div");
  }
  setLngLat() {
    return this;
  }
  addTo() {
    return this;
  }
  remove() {
    /* noop */
  }
  getElement() {
    return this.element;
  }
}
class FakeLngLatBounds {
  extend() {
    return this;
  }
  isEmpty() {
    return false;
  }
}
class FakeMap {
  once(_event: string, cb: () => void) {
    queueMicrotask(() => cb());
    return this;
  }
  on() {
    return this;
  }
  off() {
    return this;
  }
  setStyle() {
    return this;
  }
  fitBounds() {
    return this;
  }
  remove() {
    /* noop */
  }
  addControl() {
    return this;
  }
  isStyleLoaded() {
    return true;
  }
}
vi.mock("maplibre-gl", () => ({
  default: {
    Map: FakeMap,
    Marker: FakeMarker,
    LngLatBounds: FakeLngLatBounds,
    NavigationControl: class {},
  },
  Map: FakeMap,
  Marker: FakeMarker,
  LngLatBounds: FakeLngLatBounds,
  NavigationControl: class {},
}));

// ─── Component under test + store ─────────────────────────────────────
import { PublicProjectPage } from "@/components/public/public-project-page";
import { useRootStore } from "@/stores/root";

describe("F-T009 PublicProjectPage", () => {
  beforeEach(() => {
    useRootStore.getState().resetToSeed();
  });
  afterEach(() => {
    cleanup();
  });

  it("renders the seed project title in the top bar", () => {
    const title = useRootStore.getState().project.title; // "A Year in SE1"
    const slug = useRootStore.getState().project.slug;
    render(<PublicProjectPage authorHandle="@ana-ishii" slug={slug} />);
    expect(screen.getAllByText(title).length).toBeGreaterThan(0);
  });

  it("renders one card for every seed stop (12)", () => {
    const slug = useRootStore.getState().project.slug;
    render(<PublicProjectPage authorHandle="@ana-ishii" slug={slug} />);
    const cards = screen.getAllByTestId("public-stop-card");
    expect(cards).toHaveLength(12);
  });

  it("clicking a stop card does not crash the page", () => {
    const slug = useRootStore.getState().project.slug;
    render(<PublicProjectPage authorHandle="@ana-ishii" slug={slug} />);
    const cards = screen.getAllByTestId("public-stop-card");
    expect(() => fireEvent.click(cards[0])).not.toThrow();
    // Page still rendered after the click.
    expect(screen.getAllByTestId("public-stop-card")).toHaveLength(12);
  });
});
