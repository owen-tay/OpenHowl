"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { IoIosHelpCircleOutline } from "react-icons/io";

function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin() {
    setError(null);
    setLoading(true);

    try {
      // Call your FastAPI backend at /auth/login
      const response = await fetch("http://localhost:8000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password })
      });

      if (!response.ok) {
        // e.g. returns 401 if password is invalid
        throw new Error("Invalid password");
      }

      // If valid, the server returns { token: "...", role: "admin" | "user" }
      const data = await response.json();

      // Store the token and admin status in localStorage
      localStorage.setItem("authToken", data.token); 
      localStorage.setItem("isAdmin", data.role === "admin" ? "true" : "false");

      // Navigate to home
      router.push("/");
    } catch (err) {
      setError("Invalid password");
      setLoading(false);
    }
  }

  function handleInputChange(event) {
    setPassword(event.target.value);
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-base-200">
      <div className="card w-96 bg-base-100 shadow-xl p-6 animate-fadeIn">
        <h1 className="text-2xl font-bold text-center mb-4">Login</h1>
        
        <div className="flex justify-center items-center">
          <input
            type="password"
            value={password}
            onChange={handleInputChange}
            className="input input-bordered w-full mb-4"
            placeholder="Enter soundboard password"
            disabled={loading}
          />
          <div
            className="tooltip"
            data-tip="You can find this in your .env.local file or get it from the soundboard host."
          >
            <IoIosHelpCircleOutline className="mb-4" size={35} />
          </div>
        </div>
        
        <button
          onClick={handleLogin}
          className="btn btn-accent w-full mb-4"
          disabled={loading}
        >
          {loading ? (
            <span className="loading loading-bars loading-sm"></span>
          ) : (
            "Login"
          )}
        </button>
        
        {error !== null && (
          <p className="text-error mt-2 text-center">{error}</p>
        )}
      </div>
    </div>
  );
}

export default LoginPage;
