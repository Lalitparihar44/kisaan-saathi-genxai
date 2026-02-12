"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Suspense } from "react";
import AuthLayout from "components/auth/AuthLayout";
import FormField from "components/ui/form-field";
import { resetPassword } from "@/lib/auth";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await resetPassword(token, password, confirmPassword);
      if (result) {
        setSuccess(true);
        setLoading(false);
      }
      else {
        setSuccess(false);
        setLoading(false);
      }
    } catch (err) {
      console.log("Failed to reset password. Try again.", err);
      setLoading(false);
    }
  };

  return (
    <div className="col-lg-10 col-xl-7 mx-auto">
      {success ? (
        <div className="text-center">
          <h6>Password reset successful ✅</h6>
          <p className="text-muted">
            You can now log in with your new password.
          </p>

          <button
            className="btn btn-success mt-3"
            onClick={() => router.push("/login")}
          >
            Go to Login
          </button>
        </div>
      ) : (
        <form onSubmit={handleReset}>
          <FormField
            type="password"
            label="New Password"
            placeholder="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <FormField
            type="password"
            label="Confirm Password"
            placeholder="Confirm password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          <button
            type="submit"
            className="btn btn-success w-full text-uppercase rounded shadow-sm p-2 mt-3"
            disabled={loading}
          >
            {loading ? (
              <div className="spinner-border text-light" role="status">
                <span className="sr-only">Loading...</span>
              </div>
            ) : (
              "Reset Password"
            )}
          </button>
        </form>
      )}
    </div>
  );
}

export default function ResetPassword() {
  return (
    <AuthLayout title="RESET PASSWORD">
      {() => (
        <Suspense fallback={<div>Loading...</div>}>
          <ResetPasswordForm />
        </Suspense>
      )}
    </AuthLayout>
  );
}
