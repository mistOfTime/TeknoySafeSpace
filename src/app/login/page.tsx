
"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Mail, Lock, ArrowRight, Sparkles, ChevronLeft, Eye, EyeOff, CheckCircle2, Loader2, AlertCircle, ExternalLink, ShieldCheck, RefreshCw } from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth, useUser, initiateEmailSignIn, initiateEmailSignUp, initiateGoogleSignIn, initiatePasswordResetEmail } from "@/firebase"
import { toast } from "@/hooks/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

const LOGO_URL = "https://th.bing.com/th/id/R.3a932334ad4239b19672a1899a1eca35?rik=M8Bl24brJuLnoTA&riu=http%3a%2f%2fpluspng.com%2fimg-png%2fcit-logo-vector-png-cit-university-logo-765.gif&ehk=Z6uAarlxy66eMWv45sko1xzQcGBiuomXJT%2bZIG%2fLgRw%3d&risl=&pid=ImgRaw&r=0"

const TYPEWRITER_TEXT = "Teknoy SafeSpace"

function useTypewriter(text: string, speed = 80) {
  const [displayed, setDisplayed] = React.useState("")
  const [done, setDone] = React.useState(false)
  React.useEffect(() => {
    setDisplayed("")
    setDone(false)
    let i = 0
    const interval = setInterval(() => {
      setDisplayed(text.slice(0, i + 1))
      i++
      if (i >= text.length) {
        clearInterval(interval)
        setDone(true)
      }
    }, speed)
    return () => clearInterval(interval)
  }, [text, speed])
  return { displayed, done }
}

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const auth = useAuth()
  const { user, isUserLoading } = useUser()
  
  const [activeTab, setActiveTab] = React.useState<string>("login")
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)
  const [authError, setAuthError] = React.useState<string | null>(null)
  const [errorCode, setErrorCode] = React.useState<string | null>(null)
  
  const [showLoginPassword, setShowLoginPassword] = React.useState(false)
  const [showSignupPassword, setShowSignupPassword] = React.useState(false)
  const [isForgotMode, setIsForgotMode] = React.useState(false)
  const { displayed: typedTitle, done: typingDone } = useTypewriter(TYPEWRITER_TEXT)

  React.useEffect(() => {
    if (!isUserLoading && user) {
      router.push("/")
    }
  }, [user, isUserLoading, router])

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password || !auth) return
    setIsLoading(true)
    setAuthError(null)
    setErrorCode(null)
    try {
      await initiateEmailSignIn(auth, email, password)
    } catch (error: any) {
      const code = error.code || "unknown"
      setErrorCode(code)
      setAuthError(error.message || "Login failed")
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    if (!auth) return
    setIsLoading(true)
    setAuthError(null)
    setErrorCode(null)
    try {
      await initiateGoogleSignIn(auth)
      toast({
        title: "Welcome Back",
        description: "Successfully signed in with Google.",
      })
    } catch (error: any) {
      const code = error.code || "unknown"
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        setIsLoading(false)
        return
      }
      setErrorCode(code)
      setAuthError(error.message || "Google Sign-in failed")
      setIsLoading(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password || !auth) return
    setIsLoading(true)
    setAuthError(null)
    setErrorCode(null)
    try {
      await initiateEmailSignUp(auth, email, password)
      toast({
        title: "Account Created",
        description: "Welcome to Teknoy SafeSpace! Any personal email is welcome.",
      })
    } catch (error: any) {
      const code = error.code || "unknown"
      setErrorCode(code)
      setAuthError(error.message || "Sign up failed")
      setIsLoading(false)
    }
  }

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !auth) return
    setIsLoading(true)
    try {
      await initiatePasswordResetEmail(auth, email)
      toast({
        title: "Email Sent",
        description: "Check your inbox for instructions.",
      })
      setIsForgotMode(false)
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Reset Failed",
        description: error.message,
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isUserLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-secondary" />
      </div>
    )
  }

  const toolkitLink = `https://console.cloud.google.com/apis/library/identitytoolkit.googleapis.com?project=cit-u-safespace`;
  const providersLink = `https://console.firebase.google.com/project/cit-u-safespace/authentication/providers`;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background px-4">
      <div className="mb-8 flex flex-col items-center gap-4 text-center">
        <div className="relative h-20 w-20 overflow-hidden rounded-full border-2 border-secondary/30 bg-primary/10 shadow-2xl ring-4 ring-secondary/10">
          <Image src={LOGO_URL} alt="CIT Logo" fill className="object-cover" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            <span className="bg-gradient-to-r from-secondary to-accent bg-clip-text text-transparent">
              {typedTitle.slice(0, 6)}
            </span>
            <span className="text-foreground">
              {typedTitle.slice(6)}
            </span>
            <span className="inline-block w-[2px] h-7 bg-secondary ml-0.5 align-middle animate-[blink_1s_step-end_infinite]" />
          </h1>
          <p className="mt-1 text-xs text-muted-foreground uppercase tracking-widest font-bold">Safe Student Well-being Hub</p>
        </div>
      </div>

      <div className="w-full max-w-sm space-y-4">
        {errorCode && (
          <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle className="text-xs font-bold uppercase tracking-widest">
              {errorCode === 'auth/popup-blocked' ? 'Action Needed: Popup Blocked' : `Setup Required: ${errorCode}`}
            </AlertTitle>
            <AlertDescription className="text-[11px] mt-2 space-y-3">
              {errorCode === 'auth/configuration-not-found' || errorCode === 'auth/operation-not-allowed' ? (
                <>
                  <p>Firebase authentication is almost ready. Please ensure these are enabled:</p>
                  <div className="flex flex-col gap-2 mt-2">
                    <Button variant="default" size="sm" className="h-8 text-[10px] w-full font-bold bg-destructive" asChild>
                      <a href={toolkitLink} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="mr-1.5 h-3 w-3" /> 1. ENABLE API IN GOOGLE CLOUD
                      </a>
                    </Button>
                    <Button variant="default" size="sm" className="h-8 text-[10px] w-full font-bold bg-secondary text-secondary-foreground" asChild>
                      <a href={providersLink} target="_blank" rel="noopener noreferrer">
                        <ShieldCheck className="mr-1.5 h-3 w-3" /> 2. ENABLE PROVIDERS IN FIREBASE
                      </a>
                    </Button>
                  </div>
                  <p className="mt-2 text-[9px] opacity-70 italic text-center">Enable <strong>Email/Password</strong> and <strong>Google</strong> providers.</p>
                </>
              ) : errorCode === 'auth/popup-blocked' ? (
                <div className="space-y-3">
                  <p>Your browser blocked the sign-in window. Please <strong>Allow Popups</strong> for this site in your browser settings and try again.</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-8 text-[10px] w-full font-bold border-destructive/50 text-destructive hover:bg-destructive/20"
                    onClick={handleGoogleSignIn}
                  >
                    <RefreshCw className="mr-1.5 h-3 w-3" /> TRY AGAIN
                  </Button>
                </div>
              ) : (
                <p>{authError}</p>
              )}
            </AlertDescription>
          </Alert>
        )}

        <Card className="border-border/40 bg-card/60 backdrop-blur-xl shadow-2xl rounded-2xl overflow-hidden">
          {!isForgotMode ? (
            <div className="p-4 space-y-4">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-muted/50 p-1 mb-4">
                  <TabsTrigger value="login" className="font-headline uppercase tracking-widest text-[9px] h-8">Login</TabsTrigger>
                  <TabsTrigger value="signup" className="font-headline uppercase tracking-widest text-[9px] h-8">Sign Up</TabsTrigger>
                </TabsList>
                
                <TabsContent value="login" className="mt-0">
                  <form onSubmit={handleSignIn}>
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="login-email" className="text-xs">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                          <Input id="login-email" type="email" placeholder="you@gmail.com" className="h-10 pl-9 text-xs" value={email} onChange={(e) => setEmail(e.target.value)} required />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="login-password" className="text-xs">Password</Label>
                          <button type="button" onClick={() => setIsForgotMode(true)} className="text-[10px] text-secondary hover:underline">Forgot?</button>
                        </div>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                          <Input id="login-password" type={showLoginPassword ? "text" : "password"} placeholder="••••••••" className="h-10 pl-9 pr-9 text-xs" value={password} onChange={(e) => setPassword(e.target.value)} required />
                          <button type="button" onClick={() => setShowLoginPassword(!showLoginPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                            {showLoginPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      </div>
                      <Button type="submit" className="w-full bg-secondary text-secondary-foreground hover:bg-accent font-bold h-10 text-xs mt-2" disabled={isLoading}>
                        {isLoading ? "Signing in..." : "Login"}
                        {!isLoading && <ArrowRight className="ml-2 h-3.5 w-3.5" />}
                      </Button>
                    </div>
                  </form>
                </TabsContent>

                <TabsContent value="signup" className="mt-0">
                  <form onSubmit={handleSignUp}>
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="signup-email" className="text-xs">Email Address</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                          <Input id="signup-email" type="email" placeholder="you@gmail.com" className="h-10 pl-9 text-xs" value={email} onChange={(e) => setEmail(e.target.value)} required />
                        </div>
                        <p className="text-[9px] text-muted-foreground italic px-1">Personal Gmail is welcome!</p>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="signup-password" id="signup-password-label" className="text-xs">Create Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                          <Input id="signup-password" type={showSignupPassword ? "text" : "password"} placeholder="••••••••" className="h-10 pl-9 pr-9 text-xs" value={password} onChange={(e) => setPassword(e.target.value)} required />
                          <button type="button" onClick={() => setShowSignupPassword(!showSignupPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                            {showSignupPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      </div>
                      <Button type="submit" className="w-full bg-secondary text-secondary-foreground hover:bg-accent font-bold h-10 text-xs mt-2" disabled={isLoading}>
                        {isLoading ? "Creating Account..." : "Sign Up"}
                        {!isLoading && <Sparkles className="ml-2 h-3.5 w-3.5" />}
                      </Button>
                    </div>
                  </form>
                </TabsContent>
              </Tabs>

              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border/40" />
                </div>
                <div className="relative flex justify-center text-[8px] uppercase font-bold tracking-widest text-muted-foreground">
                  <span className="bg-card px-2">Or continue with</span>
                </div>
              </div>

              <Button 
                variant="outline" 
                className="w-full h-10 text-xs font-bold border-border/50 hover:bg-secondary/10 hover:text-secondary group transition-all"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
              >
                <div className="flex items-center gap-2">
                   <svg className="h-3.5 w-3.5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  Gmail / Google Account
                </div>
              </Button>
            </div>
          ) : (
            <div>
              <CardHeader className="p-4">
                <button type="button" className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-secondary mb-2" onClick={() => setIsForgotMode(false)}>
                  <ChevronLeft className="h-3 w-3" /> Back
                </button>
                <h2 className="font-headline text-lg font-bold text-secondary">Reset Password</h2>
              </CardHeader>
              <CardContent className="p-4 pt-2 space-y-4">
                <form onSubmit={handleRequestReset} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="reset-email" className="text-xs">Email</Label>
                    <Input id="reset-email" type="email" className="h-10 text-xs" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </div>
                  <Button className="w-full bg-secondary text-secondary-foreground font-bold h-10 text-xs" disabled={isLoading}>
                    {isLoading ? "Sending..." : "Send Reset Link"}
                  </Button>
                </form>
              </CardContent>
            </div>
          )}
        </Card>
      </div>
      
      <p className="mt-8 text-[10px] text-muted-foreground opacity-50 font-bold uppercase tracking-widest">
        © 2026 Teknoy SafeSpace
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <React.Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-secondary" /></div>}>
      <LoginContent />
    </React.Suspense>
  )
}
