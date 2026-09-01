import Image from "next/image";
import { LoginForm } from "@/components/auth/login-form";
import { company } from "@/lib/company";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-3">
          {/* Ordmärket ingår i logotypen — inget separat företagsnamn under. */}
          <Image
            src={company.logo.src}
            alt={company.brandName}
            width={company.logo.width}
            height={company.logo.height}
            priority
            className="h-auto w-[200px] dark:invert"
          />
          <p className="text-sm text-muted-foreground">
            Logga in i Projekthub
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
