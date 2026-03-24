"use client"

import * as React from "react"
import { TrendingUp, Calendar, AlertCircle, Activity, Target, Flame, Loader2 } from "lucide-react"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Area,
  AreaChart,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from "recharts"
import { format, parseISO } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart"
import { cn } from "@/lib/utils"
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy, limit } from "firebase/firestore"

interface HistoryItem {
  id: string
  assessmentDate: string
  stressLevel: 'Low' | 'Moderate' | 'High'
  rawScore: number
}

export default function StressHistory() {
  const { user, isUserLoading: isAuthLoading } = useUser()
  const db = useFirestore()

  const assessmentsQuery = useMemoFirebase(() => {
    if (!db || !user?.uid) return null
    return query(
      collection(db, "studentProfiles", user.uid, "stressAssessments"),
      orderBy("assessmentDate", "asc")
    )
  }, [db, user?.uid])

  const { data: assessments, isLoading } = useCollection<HistoryItem>(assessmentsQuery)

  const stats = React.useMemo(() => {
    if (!assessments || assessments.length === 0) return null
    
    const totalScore = assessments.reduce((acc, curr) => acc + curr.rawScore, 0)
    const avgScore = (totalScore / assessments.length).toFixed(1)
    
    const levels = assessments.map(a => a.stressLevel)
    const peakLevel = levels.includes('High') ? 'High' : levels.includes('Moderate') ? 'Moderate' : 'Low'
    
    const recent = assessments[assessments.length - 1]
    const previous = assessments.length > 1 ? assessments[assessments.length - 2] : null
    const trend = previous ? (recent.rawScore > previous.rawScore ? 'rising' : 'falling') : 'stable'

    return { avgScore, peakLevel, trend, count: assessments.length }
  }, [assessments])

  const chartData = React.useMemo(() => {
    if (!assessments) return []
    return assessments.slice(-10).map(item => ({
      date: format(parseISO(item.assessmentDate), "MMM d"),
      score: item.rawScore,
      level: item.stressLevel
    }))
  }, [assessments])

  const chartConfig = {
    score: {
      label: "Stress Score",
      color: "hsl(var(--secondary))",
    },
  }

  if (isAuthLoading || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-secondary" />
      </div>
    )
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-background">
        <header className="sticky top-0 z-30 flex h-14 items-center border-b border-border/40 bg-background/80 px-4 backdrop-blur-md">
          <SidebarTrigger />
          <h1 className="ml-4 font-headline text-lg font-bold tracking-tight text-secondary">Journey</h1>
        </header>

        <main className="mx-auto w-full max-w-5xl px-4 py-8 md:px-6">
          <div className="mb-8 flex flex-col gap-2">
            <h2 className="font-headline text-3xl font-bold tracking-tight text-foreground">Wellness Metrics</h2>
            <p className="text-sm text-muted-foreground">Detailed analytical breakdown of your mental well-being over time.</p>
          </div>

          {assessments && assessments.length > 0 ? (
            <div className="grid gap-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="border-border/40 bg-card/40 backdrop-blur-sm">
                  <CardContent className="p-4 flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-secondary mb-2">
                      <Activity className="h-4 w-4" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Avg Score</span>
                    </div>
                    <span className="text-2xl font-bold font-headline">{stats?.avgScore}</span>
                    <p className="text-[9px] text-muted-foreground">Baseline across {stats?.count} logs</p>
                  </CardContent>
                </Card>
                <Card className="border-border/40 bg-card/40 backdrop-blur-sm">
                  <CardContent className="p-4 flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-secondary mb-2">
                      <Target className="h-4 w-4" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Peak State</span>
                    </div>
                    <Badge variant="outline" className={cn(
                      "w-fit border-none text-[10px] h-5 px-2",
                      stats?.peakLevel === 'High' ? "bg-destructive/10 text-destructive" :
                      stats?.peakLevel === 'Moderate' ? "bg-amber-500/10 text-amber-500" :
                      "bg-emerald-500/10 text-emerald-500"
                    )}>
                      {stats?.peakLevel}
                    </Badge>
                    <p className="text-[9px] text-muted-foreground mt-1.5">Maximum observed level</p>
                  </CardContent>
                </Card>
                <Card className="border-border/40 bg-card/40 backdrop-blur-sm">
                  <CardContent className="p-4 flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-secondary mb-2">
                      <TrendingUp className="h-4 w-4" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Recent Trend</span>
                    </div>
                    <span className={cn(
                      "text-sm font-bold capitalize",
                      stats?.trend === 'rising' ? "text-amber-500" : "text-emerald-500"
                    )}>
                      {stats?.trend}
                    </span>
                    <p className="text-[9px] text-muted-foreground">Relative to previous entry</p>
                  </CardContent>
                </Card>
                <Card className="border-border/40 bg-card/40 backdrop-blur-sm">
                  <CardContent className="p-4 flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-secondary mb-2">
                      <Flame className="h-4 w-4" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Logs</span>
                    </div>
                    <span className="text-2xl font-bold font-headline">{stats?.count}</span>
                    <p className="text-[9px] text-muted-foreground">Total wellness check-ins</p>
                  </CardContent>
                </Card>
              </div>

              <Card className="border-border/40 bg-card/40 backdrop-blur-sm overflow-hidden">
                <CardHeader className="p-6 border-b border-border/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="font-headline text-lg">Stress Progression</CardTitle>
                      <CardDescription className="text-xs">Visualizing raw scores from your last 10 assessments.</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 pt-10 h-[350px]">
                  <ChartContainer config={chartConfig} className="h-full w-full">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="fillScore" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--secondary))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--secondary))" stopOpacity={0.01} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border)/0.5)" />
                      <XAxis
                        dataKey="date"
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        dy={10}
                      />
                      <YAxis 
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        domain={[0, 24]}
                      />
                      <Tooltip content={<ChartTooltipContent />} />
                      <Area
                        type="monotone"
                        dataKey="score"
                        stroke="hsl(var(--secondary))"
                        strokeWidth={3}
                        fill="url(#fillScore)"
                        animationDuration={1500}
                        dot={{ r: 4, fill: "hsl(var(--secondary))", strokeWidth: 2, stroke: "hsl(var(--background))" }}
                        activeDot={{ r: 6, strokeWidth: 0 }}
                      />
                    </AreaChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {[...assessments].reverse().map((item) => (
                  <Card key={item.id} className="border-border/50 bg-card/60 hover:bg-card/80 transition-colors">
                    <CardHeader className="flex flex-row items-center justify-between p-4 pb-1 space-y-0">
                      <div className="flex items-center gap-1.5">
                         <Calendar className="h-3 w-3 text-muted-foreground" />
                         <span className="text-[10px] font-bold text-muted-foreground uppercase">
                           {format(parseISO(item.assessmentDate), "MMM d, yyyy")}
                         </span>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "border-none text-[9px] h-4 px-1.5 font-bold",
                          item.stressLevel === 'Low' ? "bg-emerald-500/10 text-emerald-500" :
                          item.stressLevel === 'Moderate' ? "bg-amber-500/10 text-amber-500" :
                          "bg-destructive/10 text-destructive"
                        )}
                      >
                        {item.stressLevel}
                      </Badge>
                    </CardHeader>
                    <CardContent className="p-4 pt-1">
                      <div className="flex items-baseline gap-1">
                         <span className="text-2xl font-bold font-headline">{item.rawScore}</span>
                         <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">Intensity Pts</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <Card className="border-dashed border-border/60 bg-transparent py-24 text-center">
               <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/5 text-muted-foreground/40">
                 <AlertCircle className="h-10 w-10" />
               </div>
               <CardTitle className="font-headline text-2xl">No wellness data yet</CardTitle>
               <CardDescription className="mx-auto max-w-xs mt-2 text-sm">
                 Your wellness metrics will appear here once you complete your first stress assessment.
               </CardDescription>
               <div className="mt-8">
                 <Button asChild size="lg" className="rounded-full bg-secondary text-secondary-foreground hover:bg-accent px-8 font-bold">
                   <a href="/assess">Start First Assessment</a>
                 </Button>
               </div>
            </Card>
          )}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
