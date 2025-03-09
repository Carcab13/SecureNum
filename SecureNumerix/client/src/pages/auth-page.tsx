import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm, UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import ReCAPTCHA from "react-google-recaptcha";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { useEffect, useRef } from "react";
import { Logo } from "@/components/logo";


const formSchema = z.object({
  username: z.string().min(3).max(20),
  password: z.string().min(8).max(100),
  recaptchaToken: z.string().min(1, "Please complete the CAPTCHA"),
});

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (user) {
      setLocation("/");
    }
  }, [user, setLocation]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      password: "",
      recaptchaToken: "",
    },
  });

  const recaptchaRef = useRef<ReCAPTCHA>(null);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (form.formState.isValid) {
      if (form.getValues('isLogin')) {
        loginMutation.mutate(values);
      } else {
        registerMutation.mutate(values);
      }

      // Reset the reCAPTCHA
      if (recaptchaRef.current) {
        recaptchaRef.current.reset();
      }
    }
  };

  const handleRecaptchaChange = (token: string | null) => {
    form.setValue("recaptchaToken", token || "");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-4xl grid md:grid-cols-2 gap-8"
      >
        <Card className="p-6">
          <CardHeader className="space-y-1">
            <Logo className="mb-4" />
            <CardTitle className="text-2xl">Welcome to SecureNum</CardTitle>
            <p className="text-muted-foreground">
              Store your numbers securely with modern encryption and authentication.
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  🔒
                </div>
                <div>Secure Storage</div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  📊
                </div>
                <div>Easy Management</div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  🛡️
                </div>
                <div>Protected Access</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <Tabs defaultValue="login">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div>
                    <Label htmlFor="login-username">Username</Label>
                    <Input id="login-username" {...form.register("username")} />
                  </div>
                  <div>
                    <Label htmlFor="login-password">Password</Label>
                    <Input
                      id="login-password"
                      type="password"
                      {...form.register("password")}
                    />
                  </div>
                  <div className="mb-4">
                    <ReCAPTCHA
                      ref={recaptchaRef}
                      sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY || ""}
                      onChange={handleRecaptchaChange}
                    />
                    {form.formState.errors.recaptchaToken && (
                      <p className="text-sm text-destructive mt-1">
                        {form.formState.errors.recaptchaToken.message}
                      </p>
                    )}
                  </div>
                  <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? "Logging in..." : "Login"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register">
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div>
                    <Label htmlFor="register-username">Username</Label>
                    <Input
                      id="register-username"
                      {...form.register("username")}
                    />
                  </div>
                  <div>
                    <Label htmlFor="register-password">Password</Label>
                    <Input
                      id="register-password"
                      type="password"
                      {...form.register("password")}
                    />
                  </div>
                  <div className="mb-4">
                    <ReCAPTCHA
                      ref={recaptchaRef}
                      sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY || ""}
                      onChange={handleRecaptchaChange}
                    />
                    {form.formState.errors.recaptchaToken && (
                      <p className="text-sm text-destructive mt-1">
                        {form.formState.errors.recaptchaToken.message}
                      </p>
                    )}
                  </div>
                  <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? "Creating account..." : "Register"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}