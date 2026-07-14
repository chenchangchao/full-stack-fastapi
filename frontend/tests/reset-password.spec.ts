import { expect, test } from "@playwright/test"
import { findVerificationCode } from "./utils/mailcatcher"
import { randomEmail, randomPassword } from "./utils/random"
import { logInUser, signUpNewUser } from "./utils/user"

test.use({ storageState: { cookies: [], origins: [] } })

test("Password recovery form is visible", async ({ page }) => {
  await page.goto("/recover-password")
  await expect(
    page.getByRole("heading", { name: "Reset your password" }),
  ).toBeVisible()
  await expect(page.getByTestId("email-input")).toBeEditable()
  await expect(page.getByRole("button", { name: "Send code" })).toBeVisible()
  await expect(
    page.getByRole("button", { name: "Reset Password" }),
  ).toBeVisible()
})

test("User can reset password with an email code", async ({ page }) => {
  const email = randomEmail()
  const password = randomPassword()
  const newPassword = randomPassword()
  await signUpNewUser(page, "Test User", email, password)

  await page.goto("/recover-password")
  await page.getByTestId("email-input").fill(email)
  await page.getByRole("button", { name: "Send code" }).click()
  const code = await findVerificationCode({ request: page.request, email })
  await page.getByTestId("verification-code-input").fill(code)
  await page.getByTestId("new-password-input").fill(newPassword)
  await page.getByTestId("confirm-password-input").fill(newPassword)
  await page.getByRole("button", { name: "Reset Password" }).click()

  await expect(page.getByText("Password updated successfully")).toBeVisible()
  await logInUser(page, email, newPassword)
})

test("Expired or invalid reset link", async ({ page }) => {
  const password = randomPassword()
  await page.goto("/reset-password?token=invalidtoken")
  await page.getByTestId("new-password-input").fill(password)
  await page.getByTestId("confirm-password-input").fill(password)
  await page.getByRole("button", { name: "Reset Password" }).click()
  await expect(page.getByText("Invalid token")).toBeVisible()
})

test("Weak new password validation", async ({ page }) => {
  await page.goto("/recover-password")
  await page.getByTestId("email-input").fill(randomEmail())
  await page.getByTestId("verification-code-input").fill("123456")
  await page.getByTestId("new-password-input").fill("123")
  await page.getByTestId("confirm-password-input").fill("123")
  await page.getByRole("button", { name: "Reset Password" }).click()
  await expect(
    page.getByText("Password must be at least 8 characters"),
  ).toBeVisible()
})
