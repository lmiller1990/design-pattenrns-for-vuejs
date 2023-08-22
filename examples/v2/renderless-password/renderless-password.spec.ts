import { describe, it, expect, test } from "vitest";
import { render, screen, fireEvent } from "@testing-library/vue";
import TestComponent from "./RenderlessPasswordApp.vue";
import AppWithCustomValidator from "./AppWithCustomValidator.vue";
import { isMatching, calcComplexity } from "./renderless-password.js";

describe("isMatching", () => {
  it("returns true when matching", () => {
    expect(isMatching("a", "b")).toBe(false);
  });

  it("returns true when matching", () => {
    expect(isMatching("a", "a")).toBe(true);
  });
});

describe("calcComplexity", () => {
  const results: Array<[string, number]> = [
    ["a".repeat(3), 0],
    ["a".repeat(6), 1],
    ["a".repeat(8), 2],
    ["a".repeat(11), 3],
  ];

  test.each(results)(
    "return correct complexity based on length",
    (input, output) => {
      expect(calcComplexity(input)).toBe(output);
    }
  );
});

describe("component using renderless-password", () => {
  it("supports custom validator", async () => {
    const { container } = render(AppWithCustomValidator);

    await fireEvent.update(
      container.querySelector("#password")!,
      "this is a long password"
    );
    await fireEvent.update(
      container.querySelector("#confirmation")!,
      "this is a long password"
    );

    expect(screen.getByText<HTMLInputElement>("Submit").disabled).toBeTruthy();
  });

  it("meets default requirements", async () => {
    render(TestComponent);

    await fireEvent.update(
      screen.getByLabelText("Password"),
      "this is a long password"
    );
    await fireEvent.update(
      screen.getByLabelText("Confirmation"),
      "this is a long password"
    );

    expect(screen.getByTestId('complexity').textContent).toContain('Complexity: 3')
    expect(screen.getByText<HTMLInputElement>("Submit").disabled).toBeFalsy();
  });

  it("does not meet complexity requirements", async () => {
    render(TestComponent);

    await fireEvent.update(
      screen.getByLabelText("Password"),
      "shorty"
    );
    await fireEvent.update(
      screen.getByLabelText("Confirmation"),
      "shorty"
    );

    expect(screen.getByTestId('complexity').textContent).toContain('Complexity: 1')
    expect(screen.getByText<HTMLInputElement>("Submit").disabled).toBeTruthy();
  });

  it("password and confirmation does not match", async () => {
    render(TestComponent);

    await fireEvent.update(screen.getByLabelText("Password"), "abc");
    await fireEvent.update(
      screen.getByLabelText("Confirmation"),
      "def"
    );

    expect(screen.getByText<HTMLInputElement>("Submit").disabled).toBeTruthy();
  });
});

import { mount } from "@vue/test-utils";

describe("component using renderless-password", () => {
  it("supports custom validator", async () => {
    const wrapper = mount(AppWithCustomValidator);

    await wrapper
      .find('#password')
      .setValue("this is a long password");
    await wrapper
      .find('#confirmation')
      .setValue("this is a long password");

    // customValidator in AppWithCustomValidator return false no matter what
    // so button is always disabled.
    expect(wrapper.find("button").element.disabled).toBe(true);
  });

  it("meets default requirements", async () => {
    const wrapper = mount(TestComponent);

    await wrapper
      .find("#password")
      .setValue("this is a long password");
    await wrapper
      .find("#confirmation")
      .setValue("this is a long password");

    expect(wrapper.find(".complexity.low").exists()).not.toBe(true);
    expect(wrapper.find(".complexity.high").exists()).toBe(true);
    expect(wrapper.find("button").element.disabled).toBe(false);
  });

  it("does not meet complexity requirements", async () => {
    const wrapper = mount(TestComponent);

    await wrapper.find('#password').setValue("shorty");
    await wrapper.find('#confirmation').setValue("shorty");

    expect(wrapper.find("button").element.disabled).toBe(true);
    expect(wrapper.find(".complexity.high").exists()).not.toBe(true);
    expect(wrapper.find(".complexity.low").exists()).toBe(true);
  });

  it("password and confirmation does not match", async () => {
    const wrapper = mount(TestComponent);

    await wrapper.find('#password').setValue("abc");
    await wrapper.find('#confirmation').setValue("def");

    expect(wrapper.find("button").element.disabled).toBe(true);
  });
});
