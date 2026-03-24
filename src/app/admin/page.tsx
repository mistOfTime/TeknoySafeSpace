"use client"

import * as React from "react"
import { ShieldAlert, CheckCircle, Trash2, ShieldCheck, Search, Filter, Loader2, ShieldX, MessageSquare, Lightbulb, Copy, ExternalLink } from "lucide-react"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatDistanceToNow } from "date-fns"
import { Input } from "@/components/ui/input"
import { toast } from "@/hooks/use-toast"
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection } from "@/firebase"
import { doc, collection } from "firebase/firestore"
import { updateDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates"
import Link from "next/link"

interface Flag {
  id: string
  postId?: string
  suggestionId?: string
  reason: string
  details: string
  studentId: string
  createdAt: string
  status: 'pending' | 'resolved' | 'dismissed'
}

export default function AdminModeration() {
  const { user, isUserLoading } = useUser()
  const db = useFirestore()
  const [isMounted, setIsMounted] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")

  React.useEffect(() => {
    setIsMounted(true)
  }, [])

  const adminRef = useMemoFirebase(() => {
    if (!db || !user?.uid) return null
    return doc(db, "roles_admin", user.uid)
  }, [db, user?.uid])

  const { data: adminRole, isLoading: isAdminRoleLoading } = useDoc(adminRef)

  const isVerifiedAdmin = React.useMemo(() => {
    if (isAdminRoleLoading || !adminRole) return false
    const roleValue = (adminRole.Role || adminRole.role || "").toString().toLowerCase()
    return roleValue === "admin"
  }, [adminRole, isAdminRoleLoading])

  const flagsQuery = useMemoFirebase(() => {
    if (!db || !isVerifiedAdmin) return null
    return collection(db, "flags")
  }, [db, isVerifiedAdmin])

  const { data: allFlags, isLoading: isFlagsLoading } = useCollection<Flag>(flagsQuery)

  const handleDismiss = (flagId: string) => {
    if (!db) return
    const flagRef = doc(db, "flags", flagId)
    updateDocumentNonBlocking(flagRef, { status: "dismissed" })
    toast({
      title: "Report Dismissed",
      description: "The content has been marked as safe."
    })
  }

  const handleRemoveContent = async (flagId: string, contentId: string, type: 'post' | 'suggestion') => {
    if (!db) return
    
    const contentRef = doc(db, type === 'post' ? "posts" : "suggestions", contentId)
    const flagRef = doc(db, "flags", flagId)

    deleteDocumentNonBlocking(contentRef)
    updateDocumentNonBlocking(flagRef, { status: "resolved" })

    toast({
      variant: "destructive",
      title: "Content Removed",
      description: `The ${type} has been permanently deleted.`
    })
  }

  const pendingFlags = React.useMemo(() => {
    if (!allFlags) return []
    return allFlags
      .filter(f => f.status === "pending")
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [allFlags])

  const filteredFlags = pendingFlags.filter(f => 
    f.reason.toLowerCase().includes(searchQuery.toLowerCase()) || 
    f.details.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (!isMounted || isUserLoading || isAdminRoleLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-secondary" />
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Verifying Authority...</p>
        </div>
      </div>
    )
  }

  if (!isVerifiedAdmin) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="bg-background">
          <header className="sticky top-0 z-30 flex h-14 items-center border-b border-border/40 bg-background/80 px-4 backdrop-blur-md">
            <SidebarTrigger />
            <h1 className="ml-2 font-headline text-base font-bold tracking-tight text-secondary">Moderation</h1>
          </header>
          <main className="flex flex-col items-center justify-center min-h-[80vh] px-4 py-12 text-center">
            <div className="bg-destructive/10 p-4 rounded-full mb-6 text-destructive">
              <ShieldX className="h-12 w-12" />
            </div>
            <h2 className="font-headline text-2xl font-bold text-foreground">Access Pending</h2>
            <p className="mt-2 text-muted-foreground max-w-md text-sm">
              We found your document, but your role is still being synchronized. 
            </p>
            
            <Card className="mt-8 w-full max-w-md border-dashed border-border/60 bg-muted/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-widest text-secondary text-center">Identity Sync</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-left">
                <div className="flex items-start gap-3">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-secondary text-[10px] font-bold text-secondary-foreground">ID</div>
                  <p className="text-[11px] leading-tight font-mono break-all">{user?.uid}</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white">✓</div>
                  <p className="text-[11px] leading-tight">Document found in <strong>roles_admin</strong>. Refresh in a few moments if this persists.</p>
                </div>
              </CardContent>
            </Card>

            <div className="mt-8 flex gap-3">
              <Button asChild variant="outline" className="rounded-full font-bold h-9 px-6 text-xs">
                <Link href="/">Back to Feed</Link>
              </Button>
              <Button variant="default" className="bg-secondary text-secondary-foreground hover:bg-accent rounded-full font-bold h-9 px-6 text-xs" onClick={() => window.location.reload()}>
                Refresh Hub
              </Button>
            </div>
          </main>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-background">
        <header className="sticky top-0 z-30 flex h-14 items-center border-b border-border/40 bg-background/80 px-4 backdrop-blur-md">
          <SidebarTrigger />
          <div className="ml-2 flex items-center gap-2">
            <h1 className="font-headline text-base font-bold tracking-tight text-secondary">Moderation Hub</h1>
            <Badge className="bg-emerald-500/10 text-emerald-500 border-none text-[8px] h-4 font-bold">ADMIN ACTIVE</Badge>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl px-4 py-8 md:px-6">
          <div className="mb-8 flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div>
              <h2 className="font-headline text-2xl font-bold tracking-tight text-foreground">Safety Queue</h2>
              <p className="mt-1 text-xs text-muted-foreground">Monitor reports to maintain a safe campus environment.</p>
            </div>
            <div className="flex gap-3">
               <div className="bg-primary/10 px-4 py-2 rounded-xl ring-1 ring-primary/20 flex flex-col items-center min-w-[80px]">
                  <span className="text-2xl font-bold text-secondary">{pendingFlags.length}</span>
                  <span className="text-[8px] uppercase font-bold text-muted-foreground tracking-widest">Reports</span>
               </div>
            </div>
          </div>

          <div className="grid gap-6">
             <div className="flex gap-2 items-center">
                <div className="relative flex-1">
                   <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                   <Input 
                    placeholder="Search reports..." 
                    className="pl-10 border-border/50 bg-card/40 h-10 text-xs rounded-full" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                   />
                </div>
                <Button variant="outline" size="icon" className="h-10 w-10 rounded-full">
                  <Filter className="h-4 w-4" />
                </Button>
             </div>

             <Card className="border-border/40 bg-card/40 backdrop-blur-sm overflow-hidden rounded-2xl">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-muted/30">
                      <TableRow className="border-border/40 hover:bg-transparent">
                        <TableHead className="font-headline uppercase tracking-widest text-[9px] h-12 px-6">Type</TableHead>
                        <TableHead className="font-headline uppercase tracking-widest text-[9px] h-12 px-6">Reason</TableHead>
                        <TableHead className="font-headline uppercase tracking-widest text-[9px] h-12 px-6">Submitted</TableHead>
                        <TableHead className="font-headline uppercase tracking-widest text-[9px] h-12 px-6 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isFlagsLoading ? (
                        <TableRow>
                          <TableCell colSpan={4} className="h-32 text-center">
                             <Loader2 className="mx-auto h-6 w-6 animate-spin text-secondary/40" />
                          </TableCell>
                        </TableRow>
                      ) : filteredFlags.length > 0 ? filteredFlags.map((flag) => (
                        <TableRow key={flag.id} className="border-border/20 transition-colors hover:bg-muted/10">
                          <TableCell className="px-6 py-4">
                            <div className="flex items-center gap-2">
                               {flag.postId ? (
                                 <MessageSquare className="h-3.5 w-3.5 text-blue-500" />
                               ) : (
                                 <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
                               )}
                               <span className="text-[10px] font-bold uppercase tracking-tight text-foreground/70">
                                 {flag.postId ? 'Post' : 'Suggestion'}
                               </span>
                            </div>
                          </TableCell>
                          <TableCell className="px-6 py-4">
                            <div className="flex flex-col gap-0.5">
                              <Badge variant="outline" className="w-fit border-none bg-destructive/10 text-destructive text-[8px] h-4 font-bold uppercase px-1.5">
                                {flag.reason}
                              </Badge>
                              <p className="text-[10px] text-muted-foreground italic mt-1 max-w-[200px] truncate">
                                "{flag.details}"
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="text-[10px] text-muted-foreground px-6 py-4">
                            {flag.createdAt ? formatDistanceToNow(new Date(flag.createdAt), { addSuffix: true }) : 'Recently'}
                          </TableCell>
                          <TableCell className="text-right px-6 py-4">
                             <div className="flex justify-end gap-2">
                               <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleDismiss(flag.id)}
                                className="h-8 w-8 rounded-full text-emerald-500 hover:bg-emerald-500/10"
                                title="Mark Safe"
                               >
                                 <CheckCircle className="h-4 w-4" />
                               </Button>
                               <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleRemoveContent(flag.id, (flag.postId || flag.suggestionId)!, flag.postId ? 'post' : 'suggestion')}
                                className="h-8 w-8 rounded-full text-destructive hover:bg-destructive/10"
                                title="Delete Content"
                               >
                                 <Trash2 className="h-4 w-4" />
                               </Button>
                             </div>
                          </TableCell>
                        </TableRow>
                      )) : (
                        <TableRow>
                          <TableCell colSpan={4} className="h-48 text-center text-muted-foreground">
                             <div className="flex flex-col items-center justify-center gap-2">
                               <ShieldCheck className="h-10 w-10 opacity-10" />
                               <p className="text-sm font-medium">Teknoy SafeSpace: No pending reports.</p>
                             </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
             </Card>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
