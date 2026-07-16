"use client";

import { SignIn, useUser } from "@clerk/nextjs";
import { useEffect } from "react";
import { InternshipForm } from "./internship-form";

type InternshipAuthGateProps = {
  initialEmail: string;
  initialName: string;
};

export function InternshipAuthGate({ initialEmail, initialName }: InternshipAuthGateProps) {
  const { isLoaded, isSignedIn, user } = useUser();
  const email = user?.primaryEmailAddress?.emailAddress ?? initialEmail;
  const name = user
    ? [user.firstName, user.lastName].filter(Boolean).join(" ")
    : initialName;
  const isLocked = !isLoaded || !isSignedIn;

  useEffect(() => {
    if (!isLoaded || isSignedIn) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isLoaded, isSignedIn]);

  return (
    <>
      <div
        aria-hidden={isLocked}
        className={isLocked ? "pointer-events-none select-none" : undefined}
        inert={isLocked}
      >
        <InternshipForm key={isSignedIn ? email : "signed-out"} initialEmail={email} initialName={name} />
      </div>
      {isLoaded && !isSignedIn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/55 p-4 backdrop-blur-sm">
          <SignIn
            routing="virtual"
            forceRedirectUrl="/internship"
            signUpForceRedirectUrl="/internship"
          />
        </div>
      )}
    </>
  );
}
