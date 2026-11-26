import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test } from "@jest/globals";
import ts from "typescript";

// This source-level guard does not fake a viewport's native layout. It pins
// the actual JSX ownership of the scroll view: on a short screen with large
// text, no map or hint is a fixed sibling that can occlude the offer list.
test("Nearby's hint, live map, GPS note and offers share the flexible screen scroll area", () => {
  const path = resolve(__dirname, "../app/map.tsx");
  const file = ts.createSourceFile(path, readFileSync(path, "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const elements: ts.JsxElement[] = [];
  const visit = (node: ts.Node) => {
    if (ts.isJsxElement(node)) elements.push(node);
    ts.forEachChild(node, visit);
  };
  visit(file);
  const scroll = elements.find((node) =>
    node.openingElement.tagName.getText(file) === "ScrollView" &&
    node.openingElement.attributes.properties.some((property) =>
      ts.isJsxAttribute(property) && ts.isIdentifier(property.name) && property.name.text === "testID" &&
      property.initializer && ts.isStringLiteral(property.initializer) &&
      property.initializer.text === "scroll-nearby"),
  );
  expect(scroll).toBeDefined();
  const tag = scroll!.openingElement.getText(file);
  expect(tag).toContain("flex: 1");

  const scrollBody = scroll!.getText(file);
  for (const element of ["<GuideHintMount", "<NearbyNativeMap", 'testID="nearby-location-slot"', "<NearbyCard"]) {
    expect(scrollBody).toContain(element);
  }

  // Back stays outside the content scroll and cannot disappear behind the map.
  expect(scrollBody).not.toContain("<BackButton");
});
