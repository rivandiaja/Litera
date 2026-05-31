import { render, screen } from "@testing-library/react";
import { createHighlightedSegments, highlightText } from "./highlight-text";

describe("highlightText", () => {
  it("highlights matched terms case-insensitively and preserves punctuation", () => {
    expect(createHighlightedSegments("Monitoring, SNMP untuk ONU.", ["snmp", "onu"])).toEqual([
      { text: "Monitoring, ", highlighted: false },
      { text: "SNMP", highlighted: true },
      { text: " untuk ", highlighted: false },
      { text: "ONU", highlighted: true },
      { text: ".", highlighted: false },
    ]);
  });

  it("renders dangerous HTML as plain text without raw injection", () => {
    render(
      <p>
        {highlightText('<script>alert("xss")</script> snmp', ["snmp"])}
      </p>
    );

    expect(screen.getByText(/<script>alert/)).toBeInTheDocument();
    expect(document.querySelector("script")).toBeNull();
    expect(screen.getByText("snmp").tagName.toLowerCase()).toBe("mark");
  });
});
