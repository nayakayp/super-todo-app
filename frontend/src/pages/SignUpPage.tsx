import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function SignUpPage() {
  const navigate = useNavigate();
  const { signUp, isSigningUp } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await signUp({ email, password, name: name || undefined });
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign up failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <h2 className="text-3xl font-bold text-center">Sign Up</h2>
        {error && <p className="text-red-500 text-center">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name (optional)"
            className="input"
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="input"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="input"
            required
            minLength={6}
          />
          <button type="submit" disabled={isSigningUp} className="btn btn-primary w-full">
            {isSigningUp ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>
        <p className="text-center text-gray-600">
          Already have an account? <Link to="/sign-in" className="text-blue-600 hover:underline">Sign In</Link>
        </p>
      </div>
    </div>
  );
}
