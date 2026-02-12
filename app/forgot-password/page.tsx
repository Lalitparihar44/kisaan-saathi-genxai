"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AuthLayout from "components/auth/AuthLayout";
import FormField from "components/ui/form-field";
import { forgotPassword } from "@/lib/auth";

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await forgotPassword(email)
    setSent(true);
    setLoading(false);
  };

  return (
    <AuthLayout title="FORGOT PASSWORD">
      {() => (
        <div className="col-lg-10 col-xl-7 mx-auto">
          {!sent ? (
            <form onSubmit={handleSubmit}>
              <FormField
                type="email"
                placeholder="email"
                label="Registered Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                  "Send Reset Link"
                )}
              </button>

              <div className="text-center mt-3">
                <a
                  href="/login"
                  className="text-decoration-none"
                >
                  Back to Login
                </a>
              </div>
            </form>
          ) : (
            <div className="text-center">
              <h6 className="mb-2">Check your email 📩</h6>
              <p className="text-muted">
                We’ve sent a password reset link to <b>{email}</b>
              </p>

              <button
                className="btn btn-link mt-3"
                onClick={() => router.push("/login")}
              >
                Back to Login
              </button>
            </div>
          )}
        </div>
      )}
    </AuthLayout>
  );
}
