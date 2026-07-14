import { zodResolver } from "@hookform/resolvers/zod"
import {
  createFileRoute,
  Link as RouterLink,
  redirect,
} from "@tanstack/react-router"
import { useForm } from "react-hook-form"
import { z } from "zod"

import type { Body_login_login_access_token as AccessToken } from "@/client"
import { LoginService } from "@/client"
import { AuthLayout } from "@/components/Common/AuthLayout"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { LoadingButton } from "@/components/ui/loading-button"
import { PasswordInput } from "@/components/ui/password-input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import useAuth, { isLoggedIn } from "@/hooks/useAuth"
import { useEmailCode } from "@/hooks/useEmailCode"

const passwordSchema = z.object({
  username: z.email(),
  password: z
    .string()
    .min(1, { message: "Password is required" })
    .min(8, { message: "Password must be at least 8 characters" }),
}) satisfies z.ZodType<AccessToken>

const codeSchema = z.object({
  email: z.email(),
  code: z
    .string()
    .regex(/^\d{6}$/, { message: "Enter the 6-digit verification code" }),
})

type PasswordFormData = z.infer<typeof passwordSchema>
type CodeFormData = z.infer<typeof codeSchema>

export const Route = createFileRoute("/login")({
  component: Login,
  beforeLoad: async () => {
    if (isLoggedIn()) throw redirect({ to: "/" })
  },
  head: () => ({ meta: [{ title: "Log In - FastAPI Template" }] }),
})

function Login() {
  const { loginMutation, codeLoginMutation } = useAuth()
  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    mode: "onBlur",
    defaultValues: { username: "", password: "" },
  })
  const codeForm = useForm<CodeFormData>({
    resolver: zodResolver(codeSchema),
    mode: "onBlur",
    defaultValues: { email: "", code: "" },
  })
  const emailCode = useEmailCode((email) =>
    LoginService.requestLoginCode({ requestBody: { email } }),
  )

  const sendCode = async () => {
    const valid = await codeForm.trigger("email")
    if (valid) emailCode.sendCode(codeForm.getValues("email"))
  }

  return (
    <AuthLayout>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-2xl font-bold">Login to your account</h1>
        </div>

        <Tabs defaultValue="password">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="password">Password</TabsTrigger>
            <TabsTrigger value="code">Email code</TabsTrigger>
          </TabsList>

          <TabsContent value="password">
            <Form {...passwordForm}>
              <form
                onSubmit={passwordForm.handleSubmit((data) =>
                  loginMutation.mutate(data),
                )}
                className="grid gap-4 pt-3"
              >
                <FormField
                  control={passwordForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          data-testid="email-input"
                          placeholder="user@example.com"
                          type="email"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={passwordForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center">
                        <FormLabel>Password</FormLabel>
                        <RouterLink
                          to="/recover-password"
                          className="ml-auto text-sm underline-offset-4 hover:underline"
                        >
                          Forgot your password?
                        </RouterLink>
                      </div>
                      <FormControl>
                        <PasswordInput
                          data-testid="password-input"
                          placeholder="Password"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <LoadingButton type="submit" loading={loginMutation.isPending}>
                  Log In
                </LoadingButton>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="code">
            <Form {...codeForm}>
              <form
                onSubmit={codeForm.handleSubmit((data) =>
                  codeLoginMutation.mutate(data),
                )}
                className="grid gap-4 pt-3"
              >
                <FormField
                  control={codeForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="user@example.com"
                          type="email"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={codeForm.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Verification Code</FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input
                            inputMode="numeric"
                            maxLength={6}
                            placeholder="6-digit code"
                            {...field}
                          />
                        </FormControl>
                        <Button
                          type="button"
                          variant="outline"
                          disabled={
                            emailCode.isPending || emailCode.cooldown > 0
                          }
                          onClick={sendCode}
                        >
                          {emailCode.cooldown > 0
                            ? `${emailCode.cooldown}s`
                            : "Send code"}
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <LoadingButton
                  type="submit"
                  loading={codeLoginMutation.isPending}
                >
                  Log In
                </LoadingButton>
              </form>
            </Form>
          </TabsContent>
        </Tabs>

        <div className="text-center text-sm">
          Don't have an account yet?{" "}
          <RouterLink to="/signup" className="underline underline-offset-4">
            Sign up
          </RouterLink>
        </div>
      </div>
    </AuthLayout>
  )
}
