"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { User, Save, ArrowLeft, Camera, ShieldCheck, Loader2 } from "lucide-react"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase"
import { doc, setDoc } from "firebase/firestore"
import { toast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"

const COURSES = [
  { college: "College of Engineering & Architecture", programs: ["BS Architecture","BS Chemical Engineering","BS Civil Engineering","BS Computer Engineering","BS Electrical Engineering","BS Electronics Engineering","BS Industrial Engineering","BS Mechanical Engineering (Computational Science)","BS Mechanical Engineering (Mechatronics)","BS Mining Engineering"] },
  { college: "College of Computer Studies", programs: ["BS Computer Science","BS Information Technology"] },
  { college: "College of Management, Business & Accountancy", programs: ["BS Accountancy","BS Management Accounting","BS Business Administration"] },
  { college: "College of Arts, Sciences & Education", programs: ["Bachelor of Multimedia Arts (BMMA)","BS Biology","BS Psychology"] },
  { college: "College of Nursing & Allied Health Sciences", programs: ["BS Nursing","BS Pharmacy","BS Medical Technology"] },
]

export default function ProfilePage() {
  const router = useRouter()
  const { user, isUserLoading } = useUser()
  const db = useFirestore()
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const profileRef = useMemoFirebase(() => {
    if (!db || !user?.uid) return null
    return doc(db, "studentProfiles", user.uid)
  }, [db, user?.uid])

  const { data: profile, isLoading: isProfileLoading } = useDoc(profileRef)

  const [firstName, setFirstName] = React.useState("")
  const [lastName, setLastName] = React.useState("")
  const [studentId, setStudentId] = React.useState("")
  const [photoUrl, setPhotoUrl] = React.useState("")
  const [course, setCourse] = React.useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('profile_course') || ""
    }
    return ""
  })
  const [isSaving, setIsSaving] = React.useState(false)
  const hasLoaded = React.useRef(false)

  React.useEffect(() => {
    if (profile && !hasLoaded.current) {
      setFirstName(profile.firstName || "")
      setLastName(profile.lastName || "")
      setStudentId(profile.studentIdNumber || "")
      setPhotoUrl(profile.photoUrl || "")
      const savedCourse = profile.course || localStorage.getItem('profile_course') || ""
      setCourse(savedCourse)
      if (savedCourse) localStorage.setItem('profile_course', savedCourse)
      hasLoaded.current = true
    }
  }, [profile])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast({
          variant: "destructive",
          title: "File Too Large",
          description: "Please select an image smaller than 2MB.",
        })
        return
      }

      const reader = new FileReader()
      reader.onloadend = () => {
        const base64String = reader.result as string
        setPhotoUrl(base64String)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.uid || !db) return

    if (!firstName || !lastName || !studentId) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please fill out all required fields.",
      })
      return
    }

    setIsSaving(true)
    try {
      const profileData: any = {
        id: user.uid,
        firstName,
        lastName,
        studentIdNumber: studentId,
        email: user.email,
        photoUrl,
        course,
        updatedAt: new Date().toISOString(),
      }

      if (!profile) {
        profileData.dateCreated = new Date().toISOString()
      }

      const profileDocRef = doc(db, "studentProfiles", user.uid)
      await setDoc(profileDocRef, profileData, { merge: true })
      
      // Persist course in localStorage as reliable fallback
      if (course) localStorage.setItem('profile_course', course)
      
      toast({
        title: "Profile Updated",
        description: "Your changes have been saved successfully.",
      })
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error.message || "Could not update profile.",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isUserLoading || isProfileLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-secondary">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!user) {
    router.push("/login")
    return null
  }

  const initials = `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase() || user.email?.[0].toUpperCase()

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-background">
        <header className="sticky top-0 z-30 flex h-14 items-center border-b border-border/40 bg-background/80 px-4 backdrop-blur-md">
          <SidebarTrigger />
          <h1 className="ml-4 font-headline text-lg font-bold tracking-tight text-secondary">Settings</h1>
        </header>

        <main className="mx-auto w-full max-w-xl px-4 py-8 md:px-6">
          <div className="mb-6 flex items-center gap-3">
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-0">
              <h2 className="font-headline text-2xl font-bold text-foreground truncate">Profile</h2>
              <p className="text-xs text-muted-foreground truncate">Manage your community identity.</p>
            </div>
          </div>

          <form onSubmit={handleSave}>
            <div className="space-y-4">
              <Card className="border-border/40 bg-card/60 overflow-hidden">
                <CardHeader className="p-4">
                  <CardTitle className="font-headline text-base">Identity Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 p-4 pt-0">
                  <div className="flex flex-col items-center gap-6 sm:flex-row">
                    <div 
                      className="relative group cursor-pointer shrink-0" 
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Avatar className="h-24 w-24 border-2 border-primary/20 bg-secondary/10">
                        <AvatarImage src={photoUrl || `https://picsum.photos/seed/${user.uid}/200`} className="object-cover" />
                        <AvatarFallback className="text-xl font-bold text-secondary">{initials}</AvatarFallback>
                      </Avatar>
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera className="h-5 w-5 text-white" />
                      </div>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/*" 
                        onChange={handleFileChange} 
                      />
                    </div>
                    <div className="text-center sm:text-left min-w-0 flex-1 space-y-1">
                      <h3 className="font-bold text-lg leading-tight truncate">{firstName || "Student"} {lastName}</h3>
                      {studentId && (
                        <p className="text-[10px] font-bold text-secondary uppercase tracking-wider truncate">ID: {studentId}</p>
                      )}
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      {course && (
                        <p className="text-[10px] text-muted-foreground truncate">{course}</p>
                      )}
                      <div className="mt-2 flex items-center justify-center sm:justify-start gap-1 text-[9px] text-emerald-500 font-bold uppercase tracking-widest">
                        <ShieldCheck className="h-3 w-3" />
                        Verified Account
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="firstName" className="text-xs">First Name</Label>
                      <Input 
                        id="firstName" 
                        size="sm"
                        value={firstName} 
                        onChange={(e) => setFirstName(e.target.value)} 
                        className="h-9 text-xs bg-background/50"
                        maxLength={12}
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="lastName" className="text-xs">Last Name</Label>
                      <Input 
                        id="lastName" 
                        size="sm"
                        value={lastName} 
                        onChange={(e) => setLastName(e.target.value)} 
                        className="h-9 text-xs bg-background/50"
                        maxLength={12}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="studentId" className="text-xs">Student ID Number</Label>
                    <Input 
                      id="studentId" 
                      value={studentId} 
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9-]/g, '').slice(0, 11)
                        setStudentId(val)
                      }}
                      placeholder="e.g. 25-1172-604"
                      className="h-9 text-xs bg-background/50"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Course / Program</Label>
                    <Select value={course} onValueChange={setCourse}>
                      <SelectTrigger className="h-9 text-xs bg-background/50">
                        <SelectValue placeholder="Select your course" />
                      </SelectTrigger>
                      <SelectContent>
                        {COURSES.map((col) => (
                          <SelectGroup key={col.college}>
                            <SelectLabel className="text-[10px] uppercase tracking-widest text-muted-foreground">{col.college}</SelectLabel>
                            {col.programs.map((p) => (
                              <SelectItem key={p} value={p} className="text-xs">{p}</SelectItem>
                            ))}
                          </SelectGroup>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
                <CardFooter className="border-t border-border/20 p-4 bg-muted/5">
                  <Button type="submit" size="sm" disabled={isSaving} className="bg-secondary text-secondary-foreground hover:bg-accent ml-auto h-9 px-6 font-bold shadow-lg shadow-secondary/10">
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
                  </Button>
                </CardFooter>
              </Card>

              <Card className="border-border/40 bg-card/60">
                <CardContent className="p-4">
                  <p className="text-[11px] text-muted-foreground italic leading-relaxed text-center sm:text-left">
                    Your profile information is stored securely in our database. While shared posts can be anonymous to other students, your identity remains verified for safety.
                  </p>
                </CardContent>
              </Card>
            </div>
          </form>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
