// F-P002 MapLibre Atlas smoke test.
// We mock `maplibre-gl` because jsdom has no WebGL + we don't want the test
// hitting basemaps.cartocdn.com. The test just asserts the container ref
// mounts and that `new Map()` is called with the stops' centre.
import { cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ─── Mock maplibre-gl ─────────────────────────────────────────────────
// Capture constructor args so we can assert on them.
const mapCtor = vi.fn();
const markerCtor = vi.fn();

class FakeMarker {
  element: HTMLElement;
  constructor(opts: { element?: HTMLElement }) {
    markerCtor(opts);
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

// Hover popover (added in M-iter) uses `new maplibregl.Popup(...)`; the
// fake is just enough to satisfy the chainable API that renderMarkers
// calls against it. No DOM side-effects needed for this smoke test.
class FakePopup {
  setLngLat() {
    return this;
  }
  setHTML() {
    return this;
  }
  addTo() {
    return this;
  }
  remove() {
    return this;
  }
  isOpen() {
    return false;
  }
}

class FakeMap {
  constructor(opts: unknown) {
    mapCtor(opts);
  }
  once(_event: string, cb: () => void) {
    // Fire next microtask so useEffect settles.
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
    Popup: FakePopup,
    LngLatBounds: FakeLngLatBounds,
    NavigationControl: class {},
  },
  Map: FakeMap,
  Marker: FakeMarker,
  Popup: FakePopup,
  LngLatBounds: FakeLngLatBounds,
  NavigationControl: class {},
}));

// ─── Import AFTER the mock so the dynamic-import inside Atlas gets the fake.
import { Atlas } from "@/components/map/atlas";
import type { AtlasStop } from "@/components/map/atlas";

describe("F-P002 Atlas", () => {
  beforeEach(() => {
    mapCtor.mockClear();
    markerCtor.mockClear();
  });
  afterEach(() => {
    cleanup();
  });

  const stops: readonly AtlasStop[] = [
    { n: "01", title: "Alpha", lat: 51.5, lng: -0.1 },
    { n: "02", title: "Beta", lat: 51.51, lng: -0.09 },
    { n: "03", title: "Gamma", lat: 51.52, lng: -0.08 },
  ];

  it("mounts a container ref with the expected aria label", () => {
    const { getByRole } = render(<Atlas stops={stops} />);
    // The outer region is always present even before MapLibre loads.
    const region = getByRole("region");
    expect(region).toBeDefined();
    expect(region.getAttribute("aria-label")).toMatch(/3 stops/);
  });

  it("exposes the inner map container via data-testid", () => {
    const { getByTestId } = render(<Atlas stops={stops} />);
    const inner = getByTestId("atlas-map-container");
    expect(inner).toBeDefined();
    expect(inner.tagName).toBe("DIV");
  });

  it("does not throw when rendered with a custom center prop", () => {
    const { getByRole } = render(
      <Atlas stops={stops} center={[-0.05, 51.5]} height={300} />,
    );
    const region = getByRole("region");
    // inline style height is applied as CSS px.
    expect(region.getAttribute("style")).toContain("300px");
  });
});
