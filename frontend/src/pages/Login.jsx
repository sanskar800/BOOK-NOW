import React, { useContext, useEffect, useState } from "react";
import { AppContext } from "../context/AppContext";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const { backendUrl, token, setToken } = useContext(AppContext);
  const navigate = useNavigate();
  const [state, setState] = useState('Sign Up');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  
  // States for forgot password flow
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  const onSubmitHandler = async (event) => {
    event.preventDefault();

    try {
      console.log("Submitting form with state:", state);
      console.log("Backend URL:", backendUrl);
      console.log("Form data:", { name, email, password });

      if (state === 'Sign Up') {
        const { data } = await axios.post(backendUrl + '/api/user/register', { name, password, email });
        console.log("Register response:", data);
        if (data.success) {
          localStorage.setItem('token', data.token);
          setToken(data.token);
          toast.success("Account created successfully!");
        } else {
          toast.error(data.message);
        }
      } else {
        const { data } = await axios.post(backendUrl + '/api/user/login', { password, email });
        console.log("Login response:", data);
        if (data.success) {
          localStorage.setItem('token', data.token);
          setToken(data.token);
          toast.success("Login successful!");
        } else {
          toast.error(data.message);
        }
      }
    } catch (error) {
      console.error("Error during form submission:", error);
      toast.error(error.message);
    }
  };

  // Handle forgot password request
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.post(`${backendUrl}/api/user/forgot-password`, { email: forgotEmail });
      if (data.success) {
        toast.success(data.message);
        setOtpSent(true);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error("Error sending OTP. Please try again.");
    }
  };

  // Handle password reset with OTP
  const handleResetPassword = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.post(`${backendUrl}/api/user/reset-password`, {
        email: forgotEmail,
        otp,
        newPassword
      });
      if (data.success) {
        toast.success(data.message);
        setShowForgotPassword(false);
        setOtpSent(false);
        setForgotEmail('');
        setOtp('');
        setNewPassword('');
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error("Error resetting password. Please try again.");
    }
  };

  useEffect(() => {
    if (token) {
      navigate('/');
    }
  }, [token, navigate]);

  // Show forgot password form
  if (showForgotPassword) {
    return (
      <div className="min-h-[80vh] flex items-center">
        <div className="flex flex-col gap-3 m-auto items-start p-8 min-w-[340px] sm:min-w-96 border rounded-xl text-zinc-600 text-sm shadow-lg">
          <p className="text-2xl font-semibold">Reset Password</p>
          {!otpSent ? (
            <form onSubmit={handleForgotPassword} className="w-full">
              <p>Enter your email address to receive a password reset OTP</p>
              <div className="w-full mt-3">
                <p>Email</p>
                <input
                  className="border border-zinc-300 rounded w-full p-2 mt-1"
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="bg-primary text-white w-full py-2 rounded-md text-base mt-4">
                Send OTP
              </button>
              <p className="mt-4 text-center">
                <span onClick={() => setShowForgotPassword(false)} className="text-primary underline cursor-pointer">
                  Back to Login
                </span>
              </p>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="w-full">
              <p>Enter the OTP sent to your email and your new password</p>
              <div className="w-full mt-3">
                <p>OTP</p>
                <input
                  className="border border-zinc-300 rounded w-full p-2 mt-1"
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                />
              </div>
              <div className="w-full mt-3">
                <p>New Password</p>
                <input
                  className="border border-zinc-300 rounded w-full p-2 mt-1"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  minLength="8"
                  required
                />
              </div>
              <button type="submit" className="bg-primary text-white w-full py-2 rounded-md text-base mt-4">
                Reset Password
              </button>
              <p className="mt-4 text-center">
                <span onClick={() => {
                  setOtpSent(false);
                  setShowForgotPassword(false);
                }} className="text-primary underline cursor-pointer">
                  Back to Login
                </span>
              </p>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmitHandler} className="min-h-[80vh] flex items-center">
      <div className="flex flex-col gap-3 m-auto items-start p-8 min-w-[340px] sm:min-w-96 border rounded-xl text-zinc-600 text-sm shadow-lg">
        <p className="text-2xl font-semibold">{state === 'Sign Up' ? "Create Account" : "Login"}</p>
        <p>Please {state === 'Sign Up' ? "sign up" : "login"} to book your hotel.</p>
        {state === "Sign Up" && (
          <div className="w-full">
            <p>Full Name</p>
            <input
              className="border border-zinc-300 rounded w-full p-2 mt-1"
              type="text"
              onChange={(e) => setName(e.target.value)}
              value={name}
              required
            />
          </div>
        )}
        <div className="w-full">
          <p>Email</p>
          <input
            className="border border-zinc-300 rounded w-full p-2 mt-1"
            type="email"
            onChange={(e) => setEmail(e.target.value)}
            value={email}
            required
          />
        </div>
        <div className="w-full">
          <p>Password</p>
          <input
            className="border border-zinc-300 rounded w-full p-2 mt-1"
            type="password"
            onChange={(e) => setPassword(e.target.value)}
            value={password}
            required
          />
        </div>
        
        <button type="submit" className="bg-primary text-white w-full py-2 rounded-md text-base">
          {state === 'Sign Up' ? "Create Account" : "Login"}
        </button>
        
        {state === "Sign Up" ? (
          <p>
            Already have an account?{" "}
            <span onClick={() => setState('Login')} className="text-primary underline cursor-pointer">
              Login Here
            </span>
          </p>
        ) : (
          <div className="w-full">
            <p>
              Create a new account?{" "}
              <span onClick={() => setState('Sign Up')} className="text-primary underline cursor-pointer">
                Click Here
              </span>
            </p>
            <p className="mt-2">
              <span 
                onClick={() => setShowForgotPassword(true)} 
                className="text-primary underline cursor-pointer"
              >
                Forgot Password?
              </span>
            </p>
          </div>
        )}
      </div>
    </form>
  );
};

export default Login;