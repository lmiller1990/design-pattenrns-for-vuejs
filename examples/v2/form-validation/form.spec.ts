import { describe, it, expect } from "vitest";
import { required, validateRange, isFormValid } from "./form.js";

describe("required", () => {
  it("is invalid when undefined", () => {
    expect(required(undefined)).toEqual({
      valid: false,
      message: "Required",
    });
  });

  it("is invalid when empty string", () => {
    expect(required("")).toEqual({
      valid: false,
      message: "Required",
    });
  });

  it("returns true false value is present", () => {
    expect(required("some value")).toEqual({ valid: true });
  });
});

describe("isBetween", () => {
  it("returns true when value is equal to min", () => {
    expect(validateRange(5, { min: 5, max: 10 })).toEqual({
      valid: true,
    });
  });

  it("returns true when value is between min/max", () => {
    expect(validateRange(7, { min: 5, max: 10 })).toEqual({
      valid: true,
    });
  });

  it("returns true when value is equal to max", () => {
    expect(validateRange(10, { min: 5, max: 10 })).toEqual({
      valid: true,
    });
  });

  it("returns false when value is less than min", () => {
    expect(validateRange(4, { min: 5, max: 10 })).toEqual({
      valid: false,
      message: "Must be between 5 and 10",
    });
  });

  it("returns false when value is greater than max", () => {
    expect(validateRange(11, { min: 5, max: 10 })).toEqual({
      valid: false,
      message: "Must be between 5 and 10",
    });
  });
});

describe("isFormValid", () => {
  it("returns false if at least one field is invalid", () => {
    expect(
      isFormValid({ foo: { valid: true }, bar: { valid: false } })
    ).toEqual(false);
  });

  it("returns true if no invalid fields", () => {
    expect(isFormValid({ foo: { valid: true } })).toEqual(true);
  });
});
