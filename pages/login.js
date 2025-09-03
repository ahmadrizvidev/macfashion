"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Login() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // Dummy user
  const dummyUser = {
    username: "admin",
    password: "123456", // plain password
  };

  // Redirect if already logged in
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user) router.push("/dashboard");
  }, [router]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (username !== dummyUser.username) return alert("Invalid username");
    if (password !== dummyUser.password) return alert("Invalid password");

    // Save login in localStorage
    localStorage.setItem("user", JSON.stringify({ username }));
    router.push("/dashboard");
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <form
        onSubmit={handleLogin}
        className="bg-white p-8 rounded shadow-md w-96 space-y-4"
      >
        <h2 className="text-2xl font-bold">Login</h2>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full p-2 border rounded"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 border rounded"
        />
        <button
          type="submit"
          className="w-full bg-indigo-600 text-white p-2 rounded"
        >
          Login
        </button>
      </form>
    </div>
  );
}
