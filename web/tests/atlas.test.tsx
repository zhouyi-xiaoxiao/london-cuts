// F-P002 MapLibre Atlas smoke test + F-I040 viewport-stability tests.
// We mock `maplibre-gl` because jsdom has no WebGL + we don't want the test
// hitting basemaps.cartocdn.com. The smoke tests assert the container ref
// mounts and that `new Map()` is called. The F-I040 suite uses a real
// event-emitter FakeMap to verify fitBounds is called exactly once and
// never fights user input.
import { act, cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ─── Mock maplibre-gl ─────────────────────────────────────────────────
// Capture constructor args + spy on viewport-mutating calls so we can
// assert on them.
const mapCtor = vi.fn();
const markerCtor = vi.fn();
const fitBoundsSpy = vi.fn();
const resizeSpy = vi.fn();
let lastFakeMap: FakeMap | null = null;
const resizeObserverCallbacks: Array<() => void> = [];

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

// Real event-emitter FakeMap so the F-I040 suite can fire `dragstart`,
// re-fire `load`, etc. The constructor schedules a synthetic `load` on
// a microtask so the boot effect's `.once("load")` listener has time to
// register first. Never fires `idle` — we verify the production code
// dropped that listener and only relies on `load`.
class FakeMap {
  handlers = new Map<string, Array<(...args: unknown[]) => void>>();
  constructor(opts: unknown) {
    mapCtor(opts);
    lastFakeMap = this;
    queueMicrotask(() => this.fire("load"));
  }
  on(ev: string, cb: (...args: unknown[]) => void) {
    const arr = this.handlers.get(ev);
    if (arr) arr.push(cb);
    else this.handlers.set(ev, [cb]);
    return this;
  }
  off(ev: string, cb: (...args: unknown[]) => void) {
    const arr = this.handlers.get(ev);
    if (!arr) return this;
    const i = arr.indexOf(cb);
    if (i >= 0) arr.splice(i, 1);
    return this;
  }
  once(ev: string, cb: () => void) {
    const wrap = () => {
      this.off(ev, wrap);
      cb();
    };
    return this.on(ev, wrap);
  }
  fire(ev: string) {
    this.handlers
      .get(ev)
      ?.slice()
      .forEach((cb) => cb());
  }
  setStyle() {
    // Real MapLibre re-fires `load` after a successful `setStyle`. We
    // mirror that here so the F-I040 mode-change test can verify the
    // state machine prevents a re-fit even when load fires again.
    this.fire("load");
    return this;
  }
  fitBounds(...args: unknown[]) {
    fitBoundsSpy(...args);
    return this;
  }
  resize() {
    resizeSpy();
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
  project() {
    return { x: 0, y: 0 };
  }
}

class FakeResizeObserver {
  cb: () => void;
  constructor(cb: () => void) {
    this.cb = cb;
    resizeObserverCallbacks.push(cb);
  }
  observe() {
    /* noop */
  }
  disconnect() {
    /* noop */
  }
}
globalThis.ResizeObserver =
  FakeResizeObserver as unknown as typeof ResizeObserver;

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

// Helper: settle the async chain that boots the map. We need to wait
// for: (1) the IIFE's `await import("maplibre-gl")`, (2) the synchronous
// `new FakeMap(...)` after it, (3) the FakeMap constructor's
// `queueMicrotask(() => fire("load"))`, (4) the load handler calling
// `placeMarkersRef.current()`, (5) React's re-render from setReady(true).
// `setTimeout(0)` lets the macrotask queue advance, which is the only
// way to give the dynamic import time to resolve in jsdom. Two passes
// (one for the import promise, one for the microtask "load" fire) is
// the minimum that reliably settles every test.
async function flush() {
  await act(async () => {
    await new Promise((r) => setTimeout(r, 0));
  });
  await act(async () => {
    await new Promise((r) => setTimeout(r, 0));
  });
}

describe("F-P002 Atlas", () => {
  beforeEach(() => {
    mapCtor.mockClear();
    markerCtor.mockClear();
    fitBoundsSpy.mockClear();
    resizeSpy.mockClear();
    lastFakeMap = null;
    resizeObserverCallbacks.length = 0;
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

describe("F-I040 viewport stability", () => {
  beforeEach(() => {
    mapCtor.mockClear();
    markerCtor.mockClear();
    fitBoundsSpy.mockClear();
    resizeSpy.mockClear();
    lastFakeMap = null;
    resizeObserverCallbacks.length = 0;
  });
  afterEach(() => {
    cleanup();
  });

  const threeStops: readonly AtlasStop[] = [
    { n: "01", title: "Alpha", lat: 51.5, lng: -0.1 },
    { n: "02", title: "Beta", lat: 51.51, lng: -0.09 },
    { n: "03", title: "Gamma", lat: 51.52, lng: -0.08 },
  ];

  const altThreeStops: readonly AtlasStop[] = [
    { n: "01", title: "Alpha", lat: 64.13, lng: -21.94 },
    { n: "02", title: "Beta", lat: 64.14, lng: -21.93 },
    { n: "03", title: "Gamma", lat: 64.15, lng: -21.92 },
  ];

  const oneStop: readonly AtlasStop[] = [
    { n: "01", title: "Alpha", lat: 51.5, lng: -0.1 },
  ];

  it("calls fitBounds exactly once on initial load with multi-stop atlas", async () => {
    render(<Atlas stops={threeStops} />);
    await flush();
    expect(fitBoundsSpy).toHaveBeenCalledTimes(1);
  });

  it("does not call fitBounds a second time when stops change after the initial fit", async () => {
    const { rerender } = render(<Atlas stops={threeStops} />);
    await flush();
    expect(fitBoundsSpy).toHaveBeenCalledTimes(1);
    rerender(<Atlas stops={altThreeStops} />);
    await flush();
    expect(fitBoundsSpy).toHaveBeenCalledTimes(1);
  });

  it("does not call fitBounds for a single-stop atlas", async () => {
    render(<Atlas stops={oneStop} />);
    await flush();
    expect(fitBoundsSpy).not.toHaveBeenCalled();
  });

  it("calls fitBounds when stops grow from 1 → 3 before any user input", async () => {
    const { rerender } = render(<Atlas stops={oneStop} />);
    await flush();
    expect(fitBoundsSpy).not.toHaveBeenCalled();
    rerender(<Atlas stops={threeStops} />);
    await flush();
    expect(fitBoundsSpy).toHaveBeenCalledTimes(1);
  });

  it("suppresses fitBounds after the user fires a dragstart even if stops change", async () => {
    const { rerender } = render(<Atlas stops={oneStop} />);
    await flush();
    expect(fitBoundsSpy).not.toHaveBeenCalled();
    expect(lastFakeMap).not.toBeNull();
    lastFakeMap!.fire("dragstart");
    rerender(<Atlas stops={threeStops} />);
    await flush();
    expect(fitBoundsSpy).not.toHaveBeenCalled();
  });

  it("does not re-fit when setStyle re-fires `load` (mode change does not jump the camera)", async () => {
    render(<Atlas stops={threeStops} />);
    await flush();
    expect(fitBoundsSpy).toHaveBeenCalledTimes(1);
    // setStyle internally fires `load` again. The state machine should
    // see didInitialFit === true and short-circuit before fitBounds.
    lastFakeMap!.setStyle();
    await flush();
    expect(fitBoundsSpy).toHaveBeenCalledTimes(1);
  });

  it("does not register an `idle` listener (only `load`)", async () => {
    render(<Atlas stops={threeStops} />);
    await flush();
    expect(lastFakeMap!.handlers.has("idle")).toBe(false);
    expect(lastFakeMap!.handlers.has("load")).toBe(true);
  });

  it("calls map.resize() when the container ResizeObserver fires", async () => {
    render(<Atlas stops={threeStops} />);
    await flush();
    expect(resizeObserverCallbacks.length).toBeGreaterThan(0);
    resizeObserverCallbacks[0]();
    expect(resizeSpy).toHaveBeenCalled();
  });

  it("listens for user-input events (dragstart/zoomstart/wheel/pitchstart/rotatestart)", async () => {
    render(<Atlas stops={threeStops} />);
    await flush();
    const expected = [
      "dragstart",
      "zoomstart",
      "wheel",
      "pitchstart",
      "rotatestart",
    ];
    for (const ev of expected) {
      expect(lastFakeMap!.handlers.get(ev)?.length ?? 0).toBeGreaterThan(0);
    }
  });
});
