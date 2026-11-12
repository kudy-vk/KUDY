// Issue #200 — the «Пра горад» render suite: the static guide opened by the
// map menu's reserve-1 fragment. The guards are the issue's criteria: the
// document renders fully offline (criterion 8 — no fetch, no catalog, no
// map build), the four entry cards name their sections (criterion 8), the
// orientation schematic carries its Polish labels (criterion 4), every
// section's link rows point at the official pages the sources table cites
// (criteria 2–7), and the dated verification line renders under the title.
import { describe, expect, jest, test } from "@jest/globals";
import { fireEvent, renderRouter, screen } from "expo-router/testing-library";

import AboutCity from "./[id]/about";
import {
  ABOUT_CITY_LINK_URLS,
  ABOUT_CITY_MAP_ITEMS,
  ABOUT_CITY_SECTION_LINKS,
  ABOUT_CITY_VERIFIED_ON,
} from "../../components/about-city-content";
import { aboutCityStrings } from "../../components/about-city-strings";
import { frameRoutes } from "../../test/render-helpers";

// The official hosts the guide may link to — a URL outside this list fails
// the wiring guard (the sources table is the only place a new host joins).
const OFFICIAL_HOSTS = new Set([
  "www.airport.gdansk.pl",
  "ztm.gda.pl",
  "www.skm.pkp.pl",
  "jakdojade.pl",
  "mzkzg.org",
  "visitgdansk.com",
  "kartaturysty.visitgdansk.com",
  "muzeumgdansk.pl",
  "www.muzeum1939.pl",
  "www.pyszne.pl",
  "www.blik.com",
  "zamek.malbork.pl",
  "portalpasazera.pl",
  "whc.unesco.org",
]);

function openGuide() {
  renderRouter(frameRoutes(), { initialUrl: "/city/gdansk/about" });
}

test("the guide renders its whole document without any network call", async () => {
  const fetchSpy = jest.spyOn(global, "fetch");
  openGuide();
  expect(await screen.findByTestId("screen-AboutCity")).toBeTruthy();
  for (const id of ["airport", "transport", "city", "food", "karta", "malbork"]) {
    expect(screen.getByTestId(`section-about-${id}`)).toBeTruthy();
  }
  expect(fetchSpy).not.toHaveBeenCalled();
});

test("the four entry cards name their sections and the verified line carries its date", async () => {
  openGuide();
  expect(await screen.findByTestId("screen-AboutCity")).toBeTruthy();
  const strings = aboutCityStrings("be");
  for (const id of ["airport", "transport", "city", "food"] as const) {
    const entry = screen.getByTestId(`entry-about-${id}`);
    expect(entry.props.accessibilityLabel).toBe(strings[id].title);
    fireEvent.press(entry);
  }
  expect(screen.getByText(strings.verifiedLine(ABOUT_CITY_VERIFIED_ON))).toBeTruthy();
});

test("the orientation schematic renders every Polish label", async () => {
  openGuide();
  expect(await screen.findByTestId("city-schematic")).toBeTruthy();
  const strings = aboutCityStrings("be");
  for (const item of ABOUT_CITY_MAP_ITEMS) {
    expect(screen.getByText(strings.city[item.id])).toBeTruthy();
  }
});

test("every section link row rides the official host list", async () => {
  openGuide();
  expect(await screen.findByTestId("screen-AboutCity")).toBeTruthy();
  for (const [section, links] of Object.entries(ABOUT_CITY_SECTION_LINKS)) {
    expect(screen.getByTestId(`section-about-${section}`)).toBeTruthy();
    for (const linkKey of links) {
      // The same official page may serve two sections (ztmSchedule rides
      // both airport and transport) — at least one row must render here.
      expect(screen.getAllByTestId(`link-about-${linkKey}`).length).toBeGreaterThan(0);
    }
  }
  for (const [linkKey, url] of Object.entries(ABOUT_CITY_LINK_URLS)) {
    expect(url.startsWith("https://")).toBe(true);
    expect(OFFICIAL_HOSTS.has(new URL(url).hostname)).toBe(true);
  }
});

describe("the link wiring is complete (reverting a link fails the guard)", () => {
  test("every link label has a URL and every URL is rendered in a section", () => {
    const wired = new Set(
      Object.values(ABOUT_CITY_SECTION_LINKS).flatMap((links) => [...links]),
    );
    for (const key of Object.keys(ABOUT_CITY_LINK_URLS)) {
      expect(`${key}:${wired.has(key as never)}`).toBe(`${key}:true`);
    }
    expect(wired.size).toBe(Object.keys(ABOUT_CITY_LINK_URLS).length);
  });
});
