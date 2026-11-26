import { expect, jest, test } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react-native";

import { AirportDirection } from "./about-city-direction";

const t = (key: string) => ({
  "air.dirLabel": "Кірунак",
  "air.dirFrom": "З аэрапорта",
  "air.dirTo": "У аэрапорт",
})[key] ?? key;

test("airport direction cards draw plane, arrow and town in the correct order on Android", async () => {
  const onChange = jest.fn();
  await render(<AirportDirection value="from" onChange={onChange} t={t} />);

  // One SVG viewport with positioned groups: nested Svg x/y viewports
  // left only the town visible on the reported Android device.
  expect(screen.getByTestId("direction-from-plane").props.matrix).toEqual([1.5, 0, 0, 1.5, 14, 7]);
  expect(screen.getByTestId("direction-from-arrow").props.d).toBe("M58 25h16m-6-6 6 6-6 6");
  expect(screen.getByTestId("direction-from-town").props.matrix).toEqual([0.54, 0, 0, 0.54, 88, -0.54]);

  expect(screen.getByTestId("direction-to-town").props.matrix).toEqual([0.54, 0, 0, 0.54, 14, -0.54]);
  expect(screen.getByTestId("direction-to-arrow").props.d).toBe("M74 25h16m-6-6 6 6-6 6");
  expect(screen.getByTestId("direction-to-plane").props.matrix).toEqual([1.5, 0, 0, 1.5, 104, 7]);

  await fireEvent.press(screen.getByTestId("seg-direction-to"));
  expect(onChange).toHaveBeenCalledWith("to");
});
