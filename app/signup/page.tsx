"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import AuthLayout from "components/auth/AuthLayout";
import FormField from "components/ui/form-field";
import { sendOTP, verifyOTP, signup } from "lib/auth";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (countdown && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      setCountdown(null);
    }
  }, [countdown]);

  const handleSendOTP = async () => {
    if (!email || !name) {
      toast.error("Please enter email and name");
      return;
    }
    const success = await sendOTP(email, name);
    if (success) {
      setOtpSent(true);
      setCountdown(60);
    }
  };

  const handleVerifyOTP = async () => {
    if (!email || !otp) {
      toast.error("Please enter email and OTP");
      return;
    }
    const success = await verifyOTP(email, otp);
    if (success) {
      setOtpVerified(true);
      setCountdown(null);
    }
  };

  const handleSignup = async (e: any) => {
    setLoading(true);
    e.preventDefault();

    if (!otpVerified) {
      toast.error("Please verify your OTP first");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      setLoading(false);
      setPassword("");
      setConfirmPassword("");
      setLoading(false);
      return;
    }

    const success = await signup({
      email,
      password,
      confirm_password: confirmPassword,
      name: name,
      phone_no: mobile,
    });

    if (success) {
      router.push("/login");
    }

    setName("");
    setEmail("");
    setOtp("");
    setOtpSent(false);
    setOtpVerified(false);
    setMobile("");
    setLoading(false);
    setPassword("");
    setConfirmPassword("");
    setLoading(false);
  };

  return (
    <AuthLayout title="Sign up">
      {(isOfficial) => (
        <div className="col-lg-10 col-xl-7 mx-auto">
        <form onSubmit={handleSignup}>
          <FormField
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <FormField
            label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <div className="mb-3 d-flex justify-content-between align-items-center px-1">
            <span
              className={otpVerified || countdown ? "text-muted" : "cursor-pointer"}
              style={{ cursor: otpVerified || countdown ? "not-allowed" : "pointer" }}
              onClick={otpVerified || countdown ? undefined : handleSendOTP}
            >
              {otpSent ? (
                <>
                  <span className="text-muted">Resend OTP</span>
                </>
              ) : (
                <>
                  <span className="text-muted">Click here to </span>
                  <span className="text-primary text-decoration-underline">Send OTP</span>
                </>
              )}
            </span>
            {countdown && <span className="text-muted">{countdown}s</span>}
          </div>
          <FormField
            label="OTP"
            placeholder="OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            required
          />
          <div className="mb-3 ml-1">
            <button
              type="button"
              className="btn btn-link text-decoration-none ml-0 p-0"
              onClick={handleVerifyOTP}
              disabled={otpVerified}
            >
              <span className="text-muted">Click here to </span>
              <span className="text-primary text-decoration-underline">Verify OTP</span>
            </button>
          </div>
          <FormField
            label="Mobile (As Per Aadhaar)"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            required
          />

          <FormField
            type="password"
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <FormField
            type="password"
            label="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          <div className="d-flex justify-content-between align-items-center my-3">
            <button className="btn btn-success text-uppercase rounded shadow-sm w-100">
              {loading ? (
                <div className="spinner-border text-light" role="status">
                  <span className="sr-only">Loading...</span>
                </div>
              ) : (
                "Sign up"
              )}
            </button>
          </div>
          <a href="/login" className="text-decoration-none text-center d-block">
            Already have an account? Log in
          </a>
        </form>
      </div>
      )}
    </AuthLayout>
  );
}
