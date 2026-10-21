// @ts-nocheck -- run with `bun test`
import { describe, expect, it } from "bun:test";
import { isSignupConfirmationReturn, SIGNUP_RESEND_COOLDOWN_SECONDS } from "./signup-confirmation";

describe("signup confirmation", () => {
  it("requires a 60-second wait before resending", () => {
    expect(SIGNUP_RESEND_COOLDOWN_SECONDS).toBe(60);
  });
  it("recognizes only successful signup link returns", () => {
    expect(isSignupConfirmationReturn("#type=signup&access_token=test-token")).toBe(true);
    expect(isSignupConfirmationReturn("#type=signup")).toBe(false);
    expect(isSignupConfirmationReturn("#type=signup&access_token=test-token&error=expired")).toBe(false);
  });
  it("does not treat login or reset as signup confirmation", () => {
    expect(isSignupConfirmationReturn("#type=recovery&access_token=test-token")).toBe(false);
    expect(isSignupConfirmationReturn("#type=magiclink&access_token=test-token")).toBe(false);
    expect(isSignupConfirmationReturn("")).toBe(false);
  });
});