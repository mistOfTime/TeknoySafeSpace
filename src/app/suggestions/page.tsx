"use client"

import * as React from "react"
import { Lightbulb, Plus, ThumbsUp, ThumbsDown, Loader2, Filter, ShieldAlert } from "lucide-react"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection } from "@/firebase"
import { collection, query, orderBy, doc, limit, increment } from "firebase/firestore"
import { addDocumentNonBlocking, updateDocumentNonBlocking, setDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates"
import { toast } from "@/hooks/use-toast"
import { formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"

const TITLE_LIMIT = 100
const CONTENT_LIMIT = 1000

export default function SchoolSuggestions() {
  const { user, isUserLoading } = useUser()
  const db = useFirestore()
  
  const profileRef = useMemoFirebase(() => {
    if (!db || !user?.uid) return null
    return doc(db, "studentProfiles", user.uid)
  }, [db, user?.uid])
  const { data: profile } = useDoc(profileRef)

  const suggestionsQuery = useMemoFirebase(() => {
    if (!db) return null
    return query(
      collection(db, "suggestions"),
      orderBy("createdAt", "desc"),
      limit(50)
    )
  }, [db])
  const { data: suggestions, isLoading: isSuggestionsLoading } = useCollection(suggestionsQuery)

  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [title, setTitle] = React.useState("")
  const [content, setContent] = React.useState("")
  const [category, setCategory] = React.useState("Facilities")
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const handleSuggest = async () => {
    if (!title.trim() || !content.trim() || !user || !db) return
    if (title.length > TITLE_LIMIT || content.length > CONTENT_LIMIT) return

    setIsSubmitting(true)
    try {
      const suggestionsRef = collection(db, "suggestions")
      addDocumentNonBlocking(suggestionsRef, {
        title: title.trim(),
        content: content.trim(),
        category,
        authorId: user.uid,
        authorName: profile?.firstName ? `${profile.firstName} ${profile.lastName}` : user.email?.split('@')[0],
        createdAt: new Date().toISOString(),
        upvotes: 0,
        downvotes: 0,
      })

      setTitle("")
      setContent("")
      setIsDialogOpen(false)
      toast({
        title: "Suggestion Submitted",
        description: "Thank you for helping improve our school!",
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not submit suggestion.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleVote = (suggestionId: string, type: 'up' | 'down', currentVote?: 'up' | 'down' | null) => {
    if (!user || !db) return

    const voteRef = doc(db, "suggestions", suggestionId, "votes", user.uid)
    const suggestionRef = doc(db, "suggestions", suggestionId)

    if (currentVote === type) {
      updateDocumentNonBlocking(suggestionRef, {
        [type === 'up' ? 'upvotes' : 'downvotes']: increment(-1)
      })
      deleteDocumentNonBlocking(voteRef)
      toast({
        title: "Vote Removed",
        description: "Your engagement has been cleared.",
      })
    } else if (currentVote) {
      updateDocumentNonBlocking(suggestionRef, {
        [currentVote === 'up' ? 'upvotes' : 'downvotes']: increment(-1),
        [type === 'up' ? 'upvotes' : 'downvotes']: increment(1)
      })
      setDocumentNonBlocking(voteRef, { type }, { merge: true })
      toast({
        title: "Vote Changed",
        description: `You now ${type === 'up' ? 'support' : 'differ with'} this idea.`,
      })
    } else {
      updateDocumentNonBlocking(suggestionRef, {
        [type === 'up' ? 'upvotes' : 'downvotes']: increment(1)
      })
      setDocumentNonBlocking(voteRef, { type }, { merge: true })
      toast({
        title: type === 'up' ? "Idea Supported" : "Perspective Shared",
        description: "Your vote has been recorded.",
      })
    }
  }

  const handleFlag = (suggestionId: string) => {
    if (!user || !db) return
    
    const flagsRef = collection(db, "flags")
    addDocumentNonBlocking(flagsRef, {
      studentId: user.uid,
      suggestionId: suggestionId,
      reason: "Inappropriate Suggestion",
      details: "Reported from suggestions page",
      createdAt: new Date().toISOString(),
      status: "pending"
    })

    toast({
      title: "Reported",
      description: "Moderators will review this suggestion.",
    })
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background">
        <header className="sticky top-0 z-30 flex h-14 items-center border-b border-border/40 bg-background/80 px-4 backdrop-blur-md">
          <SidebarTrigger />
          <div className="ml-2 flex items-center gap-2 overflow-hidden">
            <h1 className="font-headline text-base font-bold tracking-tight text-secondary truncate">Suggestions</h1>
          </div>
          <div className="ml-auto">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="rounded-full bg-secondary text-secondary-foreground hover:bg-accent px-4 h-8 text-xs font-bold shadow-lg shadow-secondary/20">
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  <span className="hidden sm:inline">New Idea</span>
                  <span className="sm:hidden">New</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[95vw] max-w-[450px] rounded-2xl border-border bg-popover p-4 sm:p-6">
                <DialogHeader>
                  <DialogTitle className="text-secondary font-headline">Suggest Improvement</DialogTitle>
                  <DialogDescription className="text-xs">
                    Share your ideas to make CIT-U even better for everyone.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="category" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Category</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger className="h-9 text-xs bg-background/50 border-border/50">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {["Facilities", "Academic", "Campus Life", "Technology", "Other"].map(cat => (
                          <SelectItem key={cat} value={cat} className="text-xs">{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="title" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Title</Label>
                      <span className={cn("text-[9px]", title.length >= TITLE_LIMIT ? "text-destructive" : "text-muted-foreground")}>
                        {title.length}/{TITLE_LIMIT}
                      </span>
                    </div>
                    <Input 
                      id="title"
                      placeholder="e.g., More study hubs in Library" 
                      className="h-9 text-xs bg-background/50 border-border/50"
                      value={title}
                      maxLength={TITLE_LIMIT}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="content" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Details</Label>
                      <span className={cn("text-[9px]", content.length >= CONTENT_LIMIT ? "text-destructive" : "text-muted-foreground")}>
                        {content.length}/{CONTENT_LIMIT}
                      </span>
                    </div>
                    <Textarea 
                      id="content"
                      placeholder="Describe your suggestion in detail..." 
                      className="min-h-[100px] text-xs resize-none bg-background/50 border-border/50"
                      value={content}
                      maxLength={CONTENT_LIMIT}
                      onChange={(e) => setContent(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="ghost" size="sm" onClick={() => setIsDialogOpen(false)} className="text-xs h-8">Cancel</Button>
                  <Button 
                    size="sm" 
                    className="bg-secondary text-secondary-foreground hover:bg-accent font-bold h-8"
                    onClick={handleSuggest}
                    disabled={isSubmitting || !title.trim() || !content.trim()}
                  >
                    {isSubmitting ? "Submitting..." : "Submit Idea"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </header>

        <main className="mx-auto w-full max-w-2xl px-4 py-8 md:px-6">
          <div className="mb-10 flex flex-col gap-6 text-center sm:text-left">
            <div className="space-y-2">
              <h2 className="font-headline text-2xl md:text-3xl font-bold tracking-tight text-foreground leading-tight">Voice of the Students</h2>
              <p className="text-muted-foreground text-sm max-w-xl mx-auto sm:mx-0 leading-relaxed font-medium">
                Submit and vote on improvements to shape our university's future together.
              </p>
            </div>
          </div>

          <div className="grid gap-6 pb-12">
            {isSuggestionsLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                 <Loader2 className="h-8 w-8 animate-spin text-secondary/40" />
                 <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Loading Suggestions...</p>
              </div>
            ) : suggestions && suggestions.length > 0 ? (
              suggestions.map((item) => (
                <SuggestionCard 
                  key={item.id} 
                  suggestion={item} 
                  onVote={handleVote}
                  onFlag={handleFlag}
                />
              ))
            ) : (
              <Card className="border-dashed border-border/60 bg-transparent py-16 text-center rounded-3xl">
                 <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary/5 text-secondary/40">
                   <Lightbulb className="h-8 w-8" />
                 </div>
                 <CardTitle className="font-headline text-xl mb-2">No suggestions yet</CardTitle>
                 <CardDescription className="mx-auto max-w-xs text-xs mt-2 leading-relaxed">
                   Be the first to propose an improvement for CIT-U!
                 </CardDescription>
                 <Button className="mt-6 bg-secondary text-secondary-foreground hover:bg-accent font-bold px-8 rounded-full h-10 shadow-lg shadow-secondary/10" onClick={() => setIsDialogOpen(true)}>
                   Start Proposing
                 </Button>
              </Card>
            )}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}

function SuggestionCard({ suggestion, onVote, onFlag }: { suggestion: any, onVote: (id: string, type: 'up' | 'down', currentVote?: 'up' | 'down' | null) => void, onFlag: (id: string) => void }) {
  const db = useFirestore()
  const { user } = useUser()
  
  const userVoteRef = useMemoFirebase(() => {
    if (!db || !user?.uid || !suggestion.id) return null
    return doc(db, "suggestions", suggestion.id, "votes", user.uid)
  }, [db, user?.uid, suggestion.id])

  const { data: userVoteDoc } = useDoc(userVoteRef)
  const currentVote = userVoteDoc?.type as 'up' | 'down' | null | undefined

  const impact = (suggestion.upvotes || 0) - (suggestion.downvotes || 0)
  
  return (
    <Card className="group border-border/40 bg-card/60 backdrop-blur-sm hover:border-secondary/30 transition-all overflow-hidden rounded-2xl shadow-sm">
      <CardHeader className="p-4 sm:p-5 pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2 flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
               <Badge className="bg-primary/10 text-secondary border-none text-[8px] font-bold h-4 px-2 uppercase">
                 {suggestion.category}
               </Badge>
               <span className="text-[9px] text-muted-foreground font-medium">
                 {formatDistanceToNow(new Date(suggestion.createdAt), { addSuffix: true })}
               </span>
            </div>
            <CardTitle className="font-headline text-lg leading-snug break-words group-hover:text-secondary transition-colors">
              {suggestion.title}
            </CardTitle>
            <div className="flex items-center gap-1.5">
               <div className="h-4 w-4 rounded-full bg-secondary/10 flex items-center justify-center border border-secondary/20">
                  <Plus className="h-2 w-2 text-secondary" />
               </div>
               <p className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest truncate">
                 Proposed by {suggestion.authorName}
               </p>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center gap-4">
             <div className="flex flex-col items-center justify-center gap-0.5 rounded-xl bg-background/50 p-2 ring-1 ring-border/20 min-w-[56px] shadow-inner shrink-0">
               <span className={cn(
                 "text-xl font-bold font-headline",
                 impact > 0 ? "text-secondary" : impact < 0 ? "text-destructive" : "text-muted-foreground"
               )}>
                 {impact > 0 ? `+${impact}` : impact}
               </span>
               <span className="text-[7px] uppercase font-bold text-muted-foreground/60 tracking-widest">Score</span>
             </div>
             
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                    <ShieldAlert className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onFlag(suggestion.id)} className="text-xs text-destructive focus:bg-destructive/10 cursor-pointer font-bold">
                     <ShieldAlert className="mr-2 h-3.5 w-3.5" />
                     Report Suggestion
                  </DropdownMenuItem>
                </DropdownMenuContent>
             </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-4 sm:px-5 py-0">
        <div className="bg-muted/30 rounded-xl p-3 border border-border/10">
          <p className="text-sm text-foreground/80 leading-relaxed italic whitespace-pre-wrap">
            "{suggestion.content}"
          </p>
        </div>
      </CardContent>
      <CardFooter className="p-3 px-4 sm:px-5 flex flex-wrap items-center justify-start gap-3 border-t border-border/10 mt-4 bg-muted/5">
        <div className="flex items-center gap-2 flex-wrap w-full">
          <Button 
            variant="outline" 
            size="sm" 
            className={cn(
              "flex-1 h-8 rounded-full border-border/50 bg-background/50 text-[10px] font-bold transition-all active:scale-95",
              currentVote === 'up' 
                ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30" 
                : "hover:bg-emerald-500/10 hover:text-emerald-500 hover:border-emerald-500/30"
            )}
            onClick={() => onVote(suggestion.id, 'up', currentVote)}
          >
            <ThumbsUp className={cn("mr-1.5 h-3.5 w-3.5", currentVote === 'up' && "fill-current")} />
            Support <span className="ml-1 opacity-50">{suggestion.upvotes || 0}</span>
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className={cn(
              "flex-1 h-8 rounded-full border-border/50 bg-background/50 text-[10px] font-bold transition-all active:scale-95",
              currentVote === 'down' 
                ? "bg-destructive/10 text-destructive border-destructive/30" 
                : "hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
            )}
            onClick={() => onVote(suggestion.id, 'down', currentVote)}
          >
            <ThumbsDown className={cn("mr-1.5 h-3.5 w-3.5", currentVote === 'down' && "fill-current")} />
            Differ <span className="ml-1 opacity-50">{suggestion.downvotes || 0}</span>
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
