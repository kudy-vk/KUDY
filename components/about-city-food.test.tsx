// #256: exercise the actual native food body without booting unrelated Run services.
import { useState } from "react";
import { expect, jest, test } from "@jest/globals";
import { fireEvent, render } from "@testing-library/react-native";

import { AboutCityFood } from "./about-city-food";
import { ABOUT_CITY_FOOD_LINKS, aboutCityText } from "./about-city-content";
import { ABOUT_CITY_STRINGS } from "./about-city-strings.generated";

function TestFood({ language = "be", onOpen }: {
  language?: "be" | "en";
  onOpen: (url: string) => void;
}) {
  const [folds, setFolds] = useState<Record<string, boolean>>({});
  const toggleFold = (group: readonly string[], id: string, open: boolean) => {
    setFolds((before) => {
      const next = { ...before, [id]: open };
      if (open) for (const other of group) if (other !== id) next[other] = false;
      return next;
    });
  };
  return <AboutCityFood ctx={{
    t: aboutCityText(ABOUT_CITY_STRINGS[language]),
    ui: { folds },
    toggleFold,
    openLink: onOpen,
  }} />;
}

test("#256 native: four initial folds, single expansion, no payment matrix or BLIK tutorial", async () => {
  const view = await render(<TestFood onOpen={() => {}} />);
  for (const id of ["food-payment", "food-cash", "food-late", "food-delivery"]) {
    expect(view.getByTestId(`fold-${id}`).props.accessibilityState).toMatchObject({ expanded: false });
  }
  expect(view.queryByTestId("pay-blik")).toBeNull();
  await fireEvent.press(view.getByTestId("fold-food-payment"));
  expect(view.getByText("Злоты (PLN)")).toBeTruthy();
  expect(view.getByText("BLIK")).toBeTruthy();
  expect(view.queryByText(/Патрэбны рахунак у польскім банку/)).toBeNull();
  await fireEvent.press(view.getByTestId("about-food-hint-trigger-dcc"));
  expect(view.getByText(/звычайна выгадней выбраць PLN/)).toBeTruthy();
  await fireEvent.press(view.getByTestId("fold-food-cash"));
  expect(view.getByTestId("fold-food-payment").props.accessibilityState).toMatchObject({ expanded: false });
});

test("#256 native: currency office links are hidden until requested and point to Maps", async () => {
  const open = jest.fn<(url: string) => void>();
  const view = await render(<TestFood onOpen={open} />);
  await fireEvent.press(view.getByTestId("fold-food-cash"));
  expect(view.getByText(/EUR.*PLN/)).toBeTruthy();
  expect(view.queryByTestId("about-food-link-mapPromes")).toBeNull();
  await fireEvent.press(view.getByTestId("about-food-link-ratesEur"));
  expect(open).toHaveBeenCalledWith(ABOUT_CITY_FOOD_LINKS.ratesEur);
  await fireEvent.press(view.getByTestId("about-food-hint-trigger-offices"));
  await fireEvent.press(view.getByTestId("about-food-link-mapPromes"));
  expect(open).toHaveBeenCalledWith(ABOUT_CITY_FOOD_LINKS.mapPromes);
  expect(view.queryByText(/Targ Sienny|Grunwaldzka 92/)).toBeNull();
});

test("#256 native: station hours are scoped to Gdańsk Główny and delivery uses 5 shortcuts", async () => {
  const open = jest.fn<(url: string) => void>();
  const view = await render(<TestFood onOpen={open} />);
  await fireEvent.press(view.getByTestId("fold-food-late"));
  expect(view.getByText("Галоўны вакзал\nда 00:00")).toBeTruthy();
  expect(view.getByText("Галоўны вакзал\nзвычайна да 01:00")).toBeTruthy();
  await fireEvent.press(view.getByTestId("about-food-link-mapKfc"));
  expect(open).toHaveBeenCalledWith(ABOUT_CITY_FOOD_LINKS.mapKfc);
  await fireEvent.press(view.getByTestId("fold-food-delivery"));
  for (const id of ["pyszne","wolt","glovo","uber","bolt"] as const) {
    await fireEvent.press(view.getByTestId(`about-food-link-${id}`));
    expect(open).toHaveBeenCalledWith(ABOUT_CITY_FOOD_LINKS[id]);
  }
  expect(view.queryByText("Што трэба ведаць?")).toBeNull();
});

test("#256 native: English uses canonical en keys and does not show unsupported Belarusian labels", async () => {
  const view = await render(<TestFood language="en" onOpen={() => {}} />);
  expect(view.getByText("How to pay")).toBeTruthy();
  expect(view.getByText("Cash exchange & ATMs")).toBeTruthy();
  await fireEvent.press(view.getByTestId("fold-food-late"));
  expect(view.getByText("Main station\nuntil midnight")).toBeTruthy();
  expect(view.getByText("Main station\nusually until 1 AM")).toBeTruthy();
  expect(view.queryByText("Галоўны вакзал")).toBeNull();
});
