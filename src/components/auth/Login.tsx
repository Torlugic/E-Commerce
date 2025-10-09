import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../../hooks/useAuth";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login: authenticate } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await authenticate({ email, password });
      toast.success(`Welcome, ${user.name ?? user.email}`);
      navigate("/");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Login failed";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-[var(--space-2xl)] bg-[var(--surface)] p-[var(--space-lg)] rounded-[var(--radius-md)] shadow">
      <h2 className="text-2xl font-[var(--font-heading)] font-semibold mb-[var(--space-md)]">Login</h2>
      <form onSubmit={handleSubmit} className="space-y-[var(--space-md)]">
        <div>
          <label className="block mb-[var(--space-xs)]">Email</label>
          <input
            type="email"
            className="w-full p-[var(--space-sm)] border border-[var(--border)] rounded"
            value={email}
            disabled={loading}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block mb-[var(--space-xs)]">Password</label>
          <input
            type="password"
            className="w-full p-[var(--space-sm)] border border-[var(--border)] rounded"
            value={password}
            disabled={loading}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
}
