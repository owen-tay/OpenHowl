"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { IoIosHelpCircleOutline } from "react-icons/io";

function LoginPage() {
  var [password, setPassword] = useState("");
  var [error, setError] = useState(null);
  var [loading, setLoading] = useState(false);
  var router = useRouter();

  function handleLogin() {
    setError(null);
    setLoading(true);

    if (password === "admin123") {
      localStorage.setItem("authToken", "fake_admin_token");
      localStorage.setItem("isAdmin", "true");
      router.push("/");
    } else if (password === "friendpassword") {
      localStorage.setItem("authToken", "fake_user_token");
      localStorage.setItem("isAdmin", "false");
      router.push("/");
    } else {
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
            data-tip="You can find this in your config files or get it from the soundboard host."
          >
            <IoIosHelpCircleOutline className="mb-4" size={35} />
          </div>
        </div>
        <button
          onClick={handleLogin}
          className="btn btn-primary w-full mb-4"
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
