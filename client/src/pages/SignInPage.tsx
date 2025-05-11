import { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, Eye, EyeOff } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { SEO } from "@/components/SEO";

// Form validation schema
const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(8, { message: "Password must be at least 8 characters" }),
});

const registerSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters" })
    .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
    .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter" })
    .regex(/[0-9]/, { message: "Password must contain at least one number" }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function SignInPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, signUp, user } = useAuth();
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // If user is already logged in, redirect to dashboard or the page they were trying to access
  useEffect(() => {
    if (user) {
      const from = location.state?.from || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [user, navigate, location]);
  
  // Set document title on mount
  useEffect(() => {
    document.title = 'Sign In | Courseware Platform';
  }, []);
  
  // Login form
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Register form
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  // Handle login submission
  const onLoginSubmit = async (values: LoginFormValues) => {
    setAuthError(null);
    setIsLoading(true);
    
    try {
      const { error } = await signIn(values.email, values.password);
      
      if (error) throw error;
      
      // No need to navigate here - the useEffect will handle redirect when user is set
    } catch (error: any) {
      console.error("Login error:", error);
      setAuthError(error.message || "Invalid email or password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle registration submission
  const onRegisterSubmit = async (values: RegisterFormValues) => {
    setAuthError(null);
    setIsLoading(true);
    
    try {
      const { error, data } = await signUp(values.email, values.password);
      
      if (error) throw error;
      
      if (!data?.user?.identities?.length) {
        setAuthError("Email already registered. Please sign in instead.");
        return;
      }
      
      // Redirect to account page immediately after successful signup
      // since email confirmation is off
      if (data.user) {
        navigate('/account#subscription', { replace: true });
      }
      
    } catch (error: any) {
      console.error("Registration error:", error);
      setAuthError(error.message || "Could not create account. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle social login
  const handleSocialLogin = async (provider: 'google' | 'github') => {
    setAuthError(null);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
      });
      
      if (error) throw error;
      
      // The OAuth redirect will happen automatically
    } catch (error: any) {
      console.error(`${provider} login error:`, error);
      setAuthError(`Could not sign in with ${provider}. Please try again.`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <SEO
        title="Sign In | Cursor for Non-Coders"
        description="Sign in to your Cursor for Non-Coders account to access your dashboard and continue learning."
        canonicalPath="/signin"
      />
      
      <Navbar />
      
      <main className="container mx-auto px-4 py-12 max-w-md">
        {location.state?.message && (
          <Alert className="mb-6 bg-blue-900/30 text-blue-100 border-blue-700">
            <AlertDescription>{location.state.message}</AlertDescription>
          </Alert>
        )}
        
        <Tabs defaultValue="register" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6 bg-gray-800">
            <TabsTrigger value="login" className="data-[state=active]:bg-[#FF5757] data-[state=active]:text-white">Sign In</TabsTrigger>
            <TabsTrigger value="register" className="data-[state=active]:bg-[#FF5757] data-[state=active]:text-white">New User Signup</TabsTrigger>
          </TabsList>
          
          {/* Login Tab */}
          <TabsContent value="login">
            <Card className="bg-gray-900/80 border-gray-700 shadow-lg">
              <CardHeader>
                <CardTitle className="text-white">Sign In</CardTitle>
                <CardDescription className="text-gray-300">
                  Access your account and course materials.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {authError && (
                  <Alert variant="destructive" className="mb-4 bg-red-900/30 text-red-100 border-red-700">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{authError}</AlertDescription>
                  </Alert>
                )}
                
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-200">Email</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="you@example.com" 
                              {...field} 
                              className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400 focus:border-primary"
                              type="email"
                              autoComplete="email"
                            />
                          </FormControl>
                          <FormMessage className="text-red-300" />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex justify-between items-center">
                            <FormLabel className="text-gray-200">Password</FormLabel>
                            <Link 
                              to="/forgot-password"
                              className="text-xs text-gray-300 hover:text-white"
                            >
                              Forgot password?
                            </Link>
                          </div>
                          <FormControl>
                            <div className="relative">
                              <Input 
                                placeholder="••••••••" 
                                type={showLoginPassword ? "text" : "password"}
                                {...field} 
                                className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400 focus:border-primary pr-10"
                                autoComplete="current-password"
                              />
                              <button
                                type="button"
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-200"
                                onClick={() => setShowLoginPassword(!showLoginPassword)}
                                tabIndex={-1}
                              >
                                {showLoginPassword ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                                <span className="sr-only">
                                  {showLoginPassword ? "Hide password" : "Show password"}
                                </span>
                              </button>
                            </div>
                          </FormControl>
                          <FormMessage className="text-red-300" />
                        </FormItem>
                      )}
                    />
                    
                    <Button 
                      type="submit" 
                      className="w-full bg-[#FF5757] hover:bg-[#FF5757]/90 text-white" 
                      disabled={isLoading}
                    >
                      {isLoading ? "Signing in..." : "Sign In"}
                    </Button>
                  </form>
                </Form>
                
                <div className="mt-6">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <Separator className="w-full border-gray-700" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-gray-900 px-2 text-gray-400">
                        OR CONTINUE WITH
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-6 grid grid-cols-2 gap-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700 hover:text-white"
                      onClick={() => handleSocialLogin('google')}
                      disabled={isLoading}
                    >
                      <img src="/google.svg" alt="Google" className="mr-2 h-5 w-5" />
                      Google
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline"
                      className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700 hover:text-white"
                      onClick={() => handleSocialLogin('github')}
                      disabled={isLoading}
                    >
                      <img src="/github.svg" alt="GitHub" className="mr-2 h-5 w-5" />
                      GitHub
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Register Tab */}
          <TabsContent value="register">
            <Card className="bg-gray-900/80 border-gray-700 shadow-lg">
              <CardHeader>
                <CardTitle className="text-white">Create Account</CardTitle>
                <CardDescription className="text-gray-300">
                  Register to access the learning platform and features.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {authError && (
                  <Alert variant="destructive" className="mb-4 bg-red-900/30 text-red-100 border-red-700">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{authError}</AlertDescription>
                  </Alert>
                )}
                
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-200">Email</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="you@example.com" 
                              {...field} 
                              className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400 focus:border-primary"
                              type="email"
                              autoComplete="email"
                            />
                          </FormControl>
                          <FormMessage className="text-red-300" />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-200">Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input 
                                placeholder="••••••••" 
                                type={showRegisterPassword ? "text" : "password"}
                                {...field} 
                                className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400 focus:border-primary pr-10"
                                autoComplete="new-password"
                              />
                              <button
                                type="button"
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-200"
                                onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                                tabIndex={-1}
                              >
                                {showRegisterPassword ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                                <span className="sr-only">
                                  {showRegisterPassword ? "Hide password" : "Show password"}
                                </span>
                              </button>
                            </div>
                          </FormControl>
                          <FormMessage className="text-red-300" />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={registerForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-200">Confirm Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input 
                                placeholder="••••••••" 
                                type={showConfirmPassword ? "text" : "password"}
                                {...field} 
                                className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400 focus:border-primary pr-10"
                                autoComplete="new-password"
                              />
                              <button
                                type="button"
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-200"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                tabIndex={-1}
                              >
                                {showConfirmPassword ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                                <span className="sr-only">
                                  {showConfirmPassword ? "Hide password" : "Show password"}
                                </span>
                              </button>
                            </div>
                          </FormControl>
                          <FormMessage className="text-red-300" />
                        </FormItem>
                      )}
                    />
                    
                    <Button 
                      type="submit" 
                      className="w-full bg-[#FF5757] hover:bg-[#FF5757]/90 text-white" 
                      disabled={isLoading}
                    >
                      {isLoading ? "Creating Account..." : "Create Account"}
                    </Button>
                  </form>
                </Form>
                
                <div className="mt-6">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <Separator className="w-full border-gray-700" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-gray-900 px-2 text-gray-400">
                        OR CONTINUE WITH
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-6 grid grid-cols-2 gap-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700 hover:text-white"
                      onClick={() => handleSocialLogin('google')}
                      disabled={isLoading}
                    >
                      <img src="/google.svg" alt="Google" className="mr-2 h-5 w-5" />
                      Google
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline"
                      className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700 hover:text-white"
                      onClick={() => handleSocialLogin('github')}
                      disabled={isLoading}
                    >
                      <img src="/github.svg" alt="GitHub" className="mr-2 h-5 w-5" />
                      GitHub
                    </Button>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="text-xs text-gray-400 justify-center">
                By registering, you agree to our{" "}
                <Link to="/terms" className="underline hover:text-white ml-1 mr-1">
                  Terms
                </Link>
                and{" "}
                <Link to="/privacy" className="underline hover:text-white ml-1">
                  Privacy
                </Link>
                .
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      
      <Footer />
    </div>
  );
} 