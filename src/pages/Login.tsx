import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ParticleBackground } from '@/components/ParticleBackground';
import { Keypair } from '@solana/web3.js';
import { toast } from 'sonner';
import { ArrowLeft, Wallet } from 'lucide-react';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    if (!isLogin) {
      // Generate Solana wallet on registration
      const keypair = Keypair.generate();
      const publicKey = keypair.publicKey.toString();
      
      // Store user data (in production, use proper backend)
      localStorage.setItem('sollucky_user', JSON.stringify({
        username,
        publicKey,
        // In production, NEVER store private keys like this
        privateKey: Array.from(keypair.secretKey),
      }));
      
      toast.success('Account created! Wallet generated.', {
        description: `Public key: ${publicKey.slice(0, 8)}...${publicKey.slice(-8)}`,
      });
      
      navigate('/dashboard');
    } else {
      // Login logic (check localStorage in this demo)
      const storedUser = localStorage.getItem('sollucky_user');
      if (storedUser) {
        toast.success('Welcome back!');
        navigate('/dashboard');
      } else {
        toast.error('Account not found. Please register first.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center">
      <ParticleBackground />
      
      <Link to="/" className="absolute top-8 left-8 z-10">
        <Button variant="outline" className="border-primary/50 text-primary hover:bg-primary/10">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md px-4 z-10"
      >
        <div className="bg-card border border-primary/30 rounded-3xl p-8 shadow-neon">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/20 border border-primary/30 mb-4">
              <Wallet className="w-8 h-8 text-primary" />
            </div>
            <h1 className="font-orbitron text-3xl font-bold mb-2">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h1>
            <p className="text-muted-foreground">
              {isLogin 
                ? 'Log in to your Sollucky account' 
                : 'Register and get a free Solana wallet'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-2 bg-background border-border focus:border-primary"
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-2 bg-background border-border focus:border-primary"
              />
            </div>

            {!isLogin && (
              <div className="p-4 rounded-xl bg-primary/10 border border-primary/30">
                <p className="text-sm text-muted-foreground">
                  ✨ A Solana wallet will be automatically created for you upon registration
                </p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-neon"
              size="lg"
            >
              {isLogin ? 'Log In' : 'Create Account & Generate Wallet'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              {isLogin 
                ? "Don't have an account? Register" 
                : 'Already have an account? Log in'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
