// G16.03 (issue #74) — the rating form route's render suite over the real
// composition root (rule 15): the production feedback controller over the
// real node:sqlite driver and the scripted G16.02 transport. The guards: no
// preselected star, the Send disabled without one, the facts line names the
// bound target (version/locale, no catalog), the kind-closed reason chips,
// the disclosure block, and the honest delivery words (the offline round
// stays «захавана на прыладзе», the acknowledged one «адпраўлена»). The
// language guards: the UI-language switch with the form open
// re-renders the words and keeps the bound target facts, and a stale
// persisted locale renders the be fallback words. The exit guard (issue
// #599): the real Back press pops the route and the unmount cleanup leaves
// the form closed in the controller's singleton store. The issue #102
// guards: the rating is five star controls only — no visible digit buttons,
// the localized «N з 5» accessible name per star, and the 1…N filled range
// that moves on reselection.
import { afterEach, describe, expect, jest, test } from "@jest/globals";
import { fireEvent, renderRouter, screen, testRouter, waitFor } from "expo-router/testing-library";
import { act, within } from "@testing-library/react-native";
import { View } from "react-native";
import { Svg } from "react-native-svg";

import FeedbackForm from "./feedback";
import { createServices } from "../controllers/createServices";
import { layoutWith } from "../test/render-helpers";
import { feedbackStrings } from "../controllers/useFeedbackController";
import type { UiLocalePersistence, UiLocaleSwitchCode } from "../controllers/uiLocaleStore";
import { tokens } from "../components/design-tokens";
import { createFeedbackSync } from "../services/feedbackSync";
import { okPut, openIdentifiedStore, scriptedTransport, secretBox } from "../tests/feedback/queue-fixture";
import { getByType } from "../test/render-helpers";


jest.mock("react-native-safe-area-context", () => ({
  ...(jest.requireActual("react-native-safe-area-context") as Record<string, unknown>),
  useSafeAreaInsets: () => ({ top: 50, bottom: 34, left: 0, right: 0 }),
}));

const strings = feedbackStrings("be");

const withRoutes = (services: ReturnType<typeof createServices>) => ({
  _layout: layoutWith(services),
  feedback: FeedbackForm,
});

afterEach(() => {
  jest.clearAllMocks();
});

// The production world: the real feedback controller over node:sqlite and a
// scripted transport (the acked put answers revision 1).
function feedbackServices(answer = () => okPut(1), options?: { uiLocalePersistence?: UiLocalePersistence }) {
  const driver = openIdentifiedStore();
  const transport = scriptedTransport(answer);
  const sync = createFeedbackSync({
    driver,
    secretStore: secretBox("secret-a"),
    baseUrl: "https://functions.example.co/functions/v1",
    transport,
  });
  const services = createServices({ feedback: { driver, sync }, ...options });
  return { services, transport };
}

describe("G16.03: the rating form route (issue #74)", () => {
  test("the guide question opens without a preselected star and a disabled Send", async () => {
    const { services } = feedbackServices();
    await renderRouter(withRoutes(services), {
      initialUrl: "/feedback?kind=guide&id=guide-route-a1&version=1&locale=be",
    });
    expect(await screen.findByTestId("feedback-title")).toBeTruthy();
    expect(screen.getByText(strings.formTitleGuide)).toBeTruthy();
    // The facts line names the bound target, not a catalog fact.
    expect(screen.getByTestId("feedback-target-line").props.children).toBe(strings.targetLine("be", "1"));
    // No star is preselected: every control renders its unselected outline
    // state with the localized «N з 5» accessible name, and the old visible
    // digit buttons are gone — the rating is the five stars only (issue #102).
    for (const value of [1, 2, 3, 4, 5]) {
      const star = screen.getByTestId(`feedback-star-${value}`);
      expect(star.props.accessibilityState.selected).toBe(false);
      expect(star.props.accessibilityLabel).toBe(strings.starLabel(value));
      expect(getByType(star, "RNSVGSvgView").props.fill).toBe("none");
      expect(screen.queryByText(strings.starLabel(value))).toBeNull();
    }
    expect(screen.getByTestId("btn-feedback-send").props.accessibilityState.disabled).toBe(true);
    // The versioned purpose disclosure rides the form.
    expect(screen.getByTestId("feedback-disclosure-body")).toBeTruthy();
    expect(screen.getByTestId("feedback-disclosure-analytics")).toBeTruthy();
  });

  test("choosing a star enables the Send; the acked round renders «адпраўлена»", async () => {
    const { services } = feedbackServices();
    await renderRouter(withRoutes(services), {
      initialUrl: "/feedback?kind=guide&id=guide-route-a1&version=1&locale=be",
    });
    await screen.findByTestId("feedback-title");
    await fireEvent.press(screen.getByTestId("feedback-star-4"));
    expect(screen.getByTestId("btn-feedback-send").props.accessibilityState.disabled).toBe(false);
    await fireEvent.press(screen.getByTestId("btn-feedback-send"));
    expect(await screen.findByTestId("feedback-delivery")).toBeTruthy();
    expect(screen.getByTestId("feedback-delivery").props.children).toBe(strings.stateSent);
  });

  test("selecting a value fills stars 1…N; the choice stays re-selectable (issue #102)", async () => {
    const { services } = feedbackServices();
    await renderRouter(withRoutes(services), {
      initialUrl: "/feedback?kind=guide&id=guide-route-a1&version=1&locale=be",
    });
    await screen.findByTestId("feedback-title");
    await fireEvent.press(screen.getByTestId("feedback-star-4"));
    // Each star is its own «N з 5» button: the chosen one is announced
    // selected while the filled accent range marks 1…4 as a shape, not a
    // color-only signal.
    expect(screen.getByTestId("feedback-star-4").props.accessibilityState.selected).toBe(true);
    for (const value of [1, 2, 3]) {
      expect(screen.getByTestId(`feedback-star-${value}`).props.accessibilityState.selected).toBe(false);
    }
    for (const value of [1, 2, 3, 4]) {
      expect(getByType(screen.getByTestId(`feedback-star-${value}`), "RNSVGSvgView").props.fill).toBe(tokens.colorAccent);
    }
    expect(getByType(screen.getByTestId("feedback-star-5"), "RNSVGSvgView").props.fill).toBe("none");
    // The reselection moves the range: picking 2 leaves 1–2 filled and the
    // 4-star state gone.
    await fireEvent.press(screen.getByTestId("feedback-star-2"));
    expect(screen.getByTestId("feedback-star-2").props.accessibilityState.selected).toBe(true);
    expect(screen.getByTestId("feedback-star-4").props.accessibilityState.selected).toBe(false);
    for (const value of [3, 4, 5]) {
      expect(getByType(screen.getByTestId(`feedback-star-${value}`), "RNSVGSvgView").props.fill).toBe("none");
    }
    expect(getByType(screen.getByTestId("feedback-star-1"), "RNSVGSvgView").props.fill).toBe(tokens.colorAccent);
  });

  test("the offline round keeps the honest pending word (saved on the device is not sent)", async () => {
    const { services } = feedbackServices(() => {
      throw new TypeError("network unreachable");
    });
    await renderRouter(withRoutes(services), {
      initialUrl: "/feedback?kind=guide&id=guide-route-a1&version=1&locale=be",
    });
    await screen.findByTestId("feedback-title");
    await fireEvent.press(screen.getByTestId("feedback-star-3"));
    await fireEvent.press(screen.getByTestId("btn-feedback-send"));
    expect(await screen.findByTestId("feedback-delivery")).toBeTruthy();
    expect(screen.getByTestId("feedback-delivery").props.children).toBe(strings.statePending);
  });

  test("the place question offers the place reasons only — no audio chip", async () => {
    const { services } = feedbackServices();
    await renderRouter(withRoutes(services), {
      initialUrl: "/feedback?kind=place&id=place-a1&version=1&locale=be",
    });
    expect(await screen.findByTestId("feedback-title")).toBeTruthy();
    expect(screen.getByText(strings.formTitlePlace)).toBeTruthy();
    expect(screen.queryByTestId("feedback-reason-audio_problem")).toBeNull();
    expect(screen.getByTestId("feedback-reason-worth_visiting")).toBeTruthy();
  });

  test("a corrupt route target renders the honest incomplete-link state", async () => {
    const { services } = feedbackServices();
    await renderRouter(withRoutes(services), { initialUrl: "/feedback?kind=collection&id=x&version=1&locale=be" });
    expect(await screen.findByTestId("feedback-invalid")).toBeTruthy();
    expect(screen.queryByTestId("feedback-title")).toBeNull();
  });

  test("without the feedback member the surface renders its honest unavailable state", async () => {
    await renderRouter(withRoutes(createServices({})), {
      initialUrl: "/feedback?kind=guide&id=guide-route-a1&version=1&locale=be",
    });
    expect(await screen.findByTestId("feedback-unavailable")).toBeTruthy();
  });

  test("switching the UI language with the form open re-renders the words and keeps the bound target facts", async () => {
    const { services } = feedbackServices();
    await renderRouter(withRoutes(services), {
      initialUrl: "/feedback?kind=guide&id=guide-route-a1&version=1&locale=be",
    });
    await screen.findByTestId("feedback-title");
    expect(screen.getByTestId("feedback-title").props.children).toBe(strings.formTitleGuide);
    await act(() => services.uiLocale.set("uk"));
    const uk = feedbackStrings("uk");
    // The form's words follow the switch in place...
    expect(screen.getByTestId("feedback-title").props.children).toBe(uk.formTitleGuide);
    expect(screen.getByTestId("btn-feedback-send").props.accessibilityLabel).toBe(uk.send);
    expect(screen.queryByText(strings.targetLine("be", "1"))).toBeNull();
    // ...while the facts line keeps the bound identity — the content locale
    // be and the pinned version 1 in the new wording; the target's facts
    // never follow the UI switch (G14.04.d).
    expect(screen.getByTestId("feedback-target-line").props.children).toBe(uk.targetLine("be", "1"));
  });

  test("a stale persisted locale renders the be fallback words through the composition root", async () => {
    const { services } = feedbackServices(() => okPut(1), {
      // A corrupt persisted row seeds the composition root with a code the
      // closed vocabulary does not know: the store trusts read() at
      // construction, and the form must answer with the be fallback words,
      // never a raw unknown state. G21.10 (2026-10-03-single-source-translations.md — G21.10): de owns
      // a complete catalogue now, so the stale probe moved to the
      // still-planned es. G21.11–G21.13 landed es, fr and cs, and G21.14
      // (2026-10-03-single-source-translations.md — G21.14) landed sv — with pl now registered too,
      // the stale probe rides an unregistered code (eo).
      uiLocalePersistence: { read: () => "eo" as UiLocaleSwitchCode, write: () => {} },
    });
    await renderRouter(withRoutes(services), {
      initialUrl: "/feedback?kind=guide&id=guide-route-a1&version=1&locale=be",
    });
    expect(await screen.findByTestId("feedback-title")).toBeTruthy();
    expect(screen.getByTestId("feedback-title").props.children).toBe(strings.formTitleGuide);
    expect(screen.getByTestId("btn-feedback-send").props.accessibilityLabel).toBe(strings.send);
    expect(screen.getByTestId("feedback-target-line").props.children).toBe(strings.targetLine("be", "1"));
  });

  test("the Back press closes the form in the controller store (the cleanup runs on unmount)", async () => {
    const { services } = feedbackServices();
    await renderRouter(
      {
        index: () => <View />,
        ...withRoutes(services),
      },
      { initialUrl: "/" },
    );
    // The imperative router is the singleton the BackButton navigates with:
    // the push gives the back press a real stack entry to pop.
    await testRouter.push("/feedback?kind=guide&id=guide-route-a1&version=1&locale=be");
    await screen.findByTestId("feedback-title");
    expect(services.feedback?.controller?.getState().form.kind).toBe("open");
    await fireEvent.press(screen.getByTestId("btn-feedback-back"));
    // The route exit runs the unmount cleanup: if closeForm stops running,
    // the form stays open in the singleton store after the surface is gone
    // (issue #599). The pop's unmount lands a tick after the press — the
    // same closeForm contract, awaited (RNTL 14 async navigation).
    await waitFor(() => expect(services.feedback?.controller?.getState().form.kind).toBe("closed"));
    expect(screen.queryByTestId("feedback-title")).toBeNull();
  });

  test("the reasons counter updates as reason chips are toggled up to 3", async () => {
    const { services } = feedbackServices();
    await renderRouter(withRoutes(services), {
      initialUrl: "/feedback?kind=guide&id=guide-route-a1&version=1&locale=be",
    });
    expect((await screen.findByTestId("feedback-reasons-count")).props.children).toBe("0 / 3");
    await fireEvent.press(screen.getByTestId("feedback-reason-interesting_stories"));
    expect(screen.getByTestId("feedback-reasons-count").props.children).toBe("1 / 3");
  });
});
