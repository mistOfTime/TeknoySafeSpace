"use client"

import * as React from "react"
import { CheckCircle2, AlertTriangle, Info, Sparkles, BrainCircuit, ArrowRight, ClipboardCheck } from "lucide-react"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { personalizeStressGuidance, type PersonalizedStressGuidanceOutput } from "@/ai/flows/personalized-stress-guidance"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { useUser, useFirestore, useMemoFirebase } from "@/firebase"
import { collection, doc } from "firebase/firestore"
import { addDocumentNonBlocking } from "@/firebase/non-blocking-updates"

const QUESTIONS_POOL = [
  { id: 1,  text: "How often have you felt overwhelmed by academic responsibilities in the last week?", category: "Academic" },
  { id: 2,  text: "Do you find it difficult to maintain a healthy sleep schedule?", category: "Physical" },
  { id: 3,  text: "Have you felt physically exhausted even after resting?", category: "Physical" },
  { id: 4,  text: "How often do you worry about your future career or performance?", category: "Anxiety" },
  { id: 5,  text: "Do you feel like you have enough time for yourself outside of studies?", category: "Balance" },
  { id: 6,  text: "Have you experienced increased irritability or mood swings lately?", category: "Emotional" },
  { id: 7,  text: "How often do you feel anxious or nervous about upcoming exams or deadlines?", category: "Anxiety" },
  { id: 8,  text: "Do you find it hard to concentrate on your studies?", category: "Academic" },
  { id: 9,  text: "Have you been skipping meals or eating irregularly due to stress?", category: "Physical" },
  { id: 10, text: "Do you feel disconnected or isolated from your friends and classmates?", category: "Social" },
  { id: 11, text: "How often do you feel like giving up on your goals?", category: "Emotional" },
  { id: 12, text: "Do you feel pressure from family expectations about your academic performance?", category: "Academic" },
  { id: 13, text: "Have you had difficulty relaxing or unwinding after a long day?", category: "Balance" },
  { id: 14, text: "How often do you feel unmotivated to attend classes or complete tasks?", category: "Academic" },
  { id: 15, text: "Do you feel like your workload is unmanageable?", category: "Academic" },
  { id: 16, text: "Have you experienced headaches or body tension due to stress?", category: "Physical" },
  { id: 17, text: "Do you find yourself procrastinating more than usual?", category: "Balance" },
  { id: 18, text: "How often do you feel hopeful about your future?", category: "Emotional" },
]

const PICK_COUNT = 6

function pickUniqueQuestions() {
  const shuffled = [...QUESTIONS_POOL].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, PICK_COUNT)
}

const SCALES = [
  { label: "Never", value: 0 },
  { label: "Rarely", value: 1 },
  { label: "Sometimes", value: 2 },
  { label: "Often", value: 3 },
  { label: "Always", value: 4 },
]

export default function StressAssessment() {
  const { user } = useUser()
  const db = useFirestore()
  const [questions, setQuestions] = React.useState(() => pickUniqueQuestions())
  const [currentStep, setCurrentStep] = React.useState(0)
  const [answers, setAnswers] = React.useState<Record<number, number>>({})
  const [isAnalyzing, setIsAnalyzing] = React.useState(false)
  const [result, setResult] = React.useState<PersonalizedStressGuidanceOutput | null>(null)
  const [stressLevel, setStressLevel] = React.useState<'Low' | 'Moderate' | 'High'>('Low')

  const shuffleQuestions = () => {
    setQuestions(pickUniqueQuestions())
  }

  const progress = (Object.keys(answers).length / questions.length) * 100

  const handleAnswer = (questionId: number, value: number) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }))
  }

  const nextStep = () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const submitAssessment = async () => {
    if (!user || !db) {
      toast({
        variant: "destructive",
        title: "Session Error",
        description: "Please sign in to save your results.",
      })
      return
    }

    setIsAnalyzing(true)
    try {
      const totalScore = Object.values(answers).reduce((a, b) => a + b, 0)
      const maxScore = questions.length * 4
      const ratio = totalScore / maxScore

      let level: 'Low' | 'Moderate' | 'High' = 'Low'
      if (ratio > 0.7) level = 'High'
      else if (ratio > 0.3) level = 'Moderate'
      
      setStressLevel(level)

      const highValueCategories = Object.entries(answers)
        .filter(([_, val]) => val >= 3)
        .map(([qid, _]) => questions.find(q => q.id === Number(qid))?.category)
        .filter(Boolean)

      const assessmentDetails = `User scored ${totalScore}/${maxScore}. Main concerns seem to be ${
        highValueCategories.length > 0 ? highValueCategories.join(", ") : "general academic pressure"
      }.`

      const fallbackResults: Record<string, PersonalizedStressGuidanceOutput> = {
        Low: {
          empatheticMessage: "You're doing well! Keep maintaining your healthy habits and stay consistent.",
          copingStrategies: ["Keep a daily journal", "Stay physically active", "Maintain your sleep schedule"],
          recommendedActions: ["Set small daily goals", "Connect with friends regularly", "Take short breaks between study sessions"]
        },
        Moderate: {
          empatheticMessage: "You're managing, but it's okay to ask for support. Take things one step at a time.",
          copingStrategies: ["Practice deep breathing exercises", "Break tasks into smaller steps", "Limit screen time before bed"],
          recommendedActions: ["Talk to a trusted friend or counselor", "Schedule regular rest periods", "Prioritize your most important tasks first"]
        },
        High: {
          empatheticMessage: "It sounds like you're going through a tough time. You're not alone — please reach out for support.",
          copingStrategies: ["Reach out to a counselor or trusted adult", "Practice mindfulness or meditation", "Avoid isolating yourself"],
          recommendedActions: ["Visit the school guidance office", "Take a break from non-essential commitments", "Focus on basic self-care: sleep, food, water"]
        }
      }

      let aiResponse: PersonalizedStressGuidanceOutput
      try {
        aiResponse = await personalizeStressGuidance({ stressLevel: level, assessmentDetails })
      } catch {
        aiResponse = fallbackResults[level]
      }

      const assessmentsRef = collection(db, "studentProfiles", user.uid, "stressAssessments")
      addDocumentNonBlocking(assessmentsRef, {
        studentId: user.uid,
        assessmentDate: new Date().toISOString(),
        stressLevel: level,
        rawScore: totalScore,
        recommendation: aiResponse.empatheticMessage
      })

      setResult(aiResponse)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to process assessment.",
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  const reset = () => {
    setAnswers({})
    setCurrentStep(0)
    setResult(null)
    shuffleQuestions()
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-background">
        <header className="sticky top-0 z-30 flex h-14 items-center border-b border-border/40 bg-background/80 px-4 backdrop-blur-md">
          <SidebarTrigger />
          <h1 className="ml-2 font-headline text-base font-bold tracking-tight text-secondary">Check-in</h1>
        </header>

        <main className="mx-auto w-full max-w-2xl px-4 py-6 md:px-6">
          {!result ? (
            <Card className="border-border/50 bg-card/50 shadow-xl overflow-hidden rounded-xl">
              <CardHeader className="text-center pb-2 pt-6">
                <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-secondary/10 text-secondary">
                  <ClipboardCheck className="h-5 w-5" />
                </div>
                <CardTitle className="font-headline text-xl text-secondary">How are you?</CardTitle>
                <div className="mt-4 px-4">
                  <Progress value={progress} className="h-1 bg-muted/50" />
                  <p className="mt-2 text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                    Question {currentStep + 1} of {questions.length}
                  </p>
                </div>
              </CardHeader>

              <CardContent className="py-6 px-4">
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <h3 className="text-center font-headline text-lg font-medium leading-snug">
                    {questions[currentStep].text}
                  </h3>
                  
                  <RadioGroup 
                    value={answers[questions[currentStep].id]?.toString()} 
                    onValueChange={(val) => handleAnswer(questions[currentStep].id, Number(val))}
                    className="grid grid-cols-1 gap-2 sm:grid-cols-5"
                  >
                    {SCALES.map((scale) => (
                      <div key={scale.value}>
                        <RadioGroupItem
                          value={scale.value.toString()}
                          id={`scale-${scale.value}`}
                          className="peer sr-only"
                        />
                        <Label
                          htmlFor={`scale-${scale.value}`}
                          className="flex w-full cursor-pointer items-center justify-center rounded-lg border border-border/50 bg-background/50 p-3 text-center transition-all peer-data-[state=checked]:border-secondary peer-data-[state=checked]:bg-secondary/10 hover:border-secondary/30 sm:flex-col sm:p-2"
                        >
                          <span className="text-sm font-semibold text-foreground sm:text-xs">{scale.label}</span>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              </CardContent>

              <CardFooter className="flex justify-between border-t border-border/30 pt-4 p-4">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                  disabled={currentStep === 0}
                  className="text-xs text-muted-foreground h-8"
                >
                  Back
                </Button>
                
                {currentStep === questions.length - 1 ? (
                  <Button 
                    size="sm"
                    onClick={submitAssessment} 
                    disabled={Object.keys(answers).length < questions.length || isAnalyzing}
                    className="bg-secondary text-secondary-foreground hover:bg-accent px-4 h-8 text-xs font-bold"
                  >
                    {isAnalyzing ? "Analyzing..." : "Get Results"}
                    {!isAnalyzing && <BrainCircuit className="ml-1.5 h-3.5 w-3.5" />}
                  </Button>
                ) : (
                  <Button 
                    size="sm"
                    onClick={nextStep} 
                    disabled={answers[questions[currentStep].id] === undefined}
                    className="bg-secondary text-secondary-foreground hover:bg-accent h-8 text-xs font-bold px-4"
                  >
                    Next
                    <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </Button>
                )}
              </CardFooter>
            </Card>
          ) : (
            <div className="space-y-4 animate-in zoom-in-95 duration-700">
              <Card className="overflow-hidden border-border/40 bg-card/60 backdrop-blur-md shadow-xl rounded-xl">
                <div className={cn(
                  "h-1 w-full",
                  stressLevel === 'Low' ? "bg-emerald-500" : 
                  stressLevel === 'Moderate' ? "bg-amber-500" : "bg-destructive"
                )} />
                <CardHeader className="text-center pb-2 pt-6">
                  <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-background ring-2 ring-border/20">
                    {stressLevel === 'Low' && <CheckCircle2 className="h-5 w-5 text-emerald-500" />}
                    {stressLevel === 'Moderate' && <Info className="h-5 w-5 text-amber-500" />}
                    {stressLevel === 'High' && <AlertTriangle className="h-5 w-5 text-destructive" />}
                  </div>
                  <CardTitle className="font-headline text-lg text-foreground">
                    Level: <span className={cn(
                      stressLevel === 'Low' ? "text-emerald-500" : 
                      stressLevel === 'Moderate' ? "text-amber-500" : "text-destructive"
                    )}>{stressLevel}</span>
                  </CardTitle>
                  <CardDescription className="text-xs mt-2 px-4 italic leading-relaxed">
                    "{result.empatheticMessage}"
                  </CardDescription>
                </CardHeader>

                <CardContent className="grid gap-3 p-4 sm:grid-cols-2">
                  <div className="space-y-2 rounded-lg bg-primary/5 p-3 ring-1 ring-primary/10">
                    <div className="flex items-center gap-1.5 text-secondary">
                      <Sparkles className="h-3.5 w-3.5" />
                      <h4 className="font-headline text-sm font-bold uppercase tracking-wider">Coping</h4>
                    </div>
                    <ul className="space-y-1.5">
                      {result.copingStrategies.map((item, i) => (
                        <li key={i} className="flex gap-2 text-[11px] text-foreground/80 leading-snug">
                          <div className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-secondary" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-2 rounded-lg bg-secondary/5 p-3 ring-1 ring-secondary/10">
                    <div className="flex items-center gap-1.5 text-secondary">
                      <BrainCircuit className="h-3.5 w-3.5" />
                      <h4 className="font-headline text-sm font-bold uppercase tracking-wider">Actions</h4>
                    </div>
                    <ul className="space-y-1.5">
                      {result.recommendedActions.map((item, i) => (
                        <li key={i} className="flex gap-2 text-[11px] text-foreground/80 leading-snug">
                          <div className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-secondary" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>

                <CardFooter className="flex flex-col gap-3 border-t border-border/20 p-4 sm:flex-row sm:justify-between">
                  <p className="text-[9px] text-muted-foreground italic text-center sm:text-left sm:max-w-[150px]">
                    Guidance for support, not medical advice.
                  </p>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Button variant="outline" size="sm" onClick={reset} className="flex-1 sm:flex-none text-[11px] h-8">Retake</Button>
                    <Button size="sm" className="bg-secondary text-secondary-foreground flex-1 sm:flex-none text-[11px] h-8" asChild>
                      <a href="/resources">Library</a>
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            </div>
          )}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
