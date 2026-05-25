import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground text-lg font-bold">
            A
          </div>
          <h1 className="text-xl font-semibold">APM Project</h1>
          <p className="text-sm text-muted-foreground">
            Logga in i Projekthub
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
