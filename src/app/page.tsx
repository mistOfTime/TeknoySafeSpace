
"use client"

import * as React from "react"
import { Send, Heart, Plus, Loader2, MessageSquareOff } from "lucide-react"
import { useRouter } from "next/navigation"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { PostCard } from "@/components/post-card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog"
import { moderatePostContent } from "@/ai/flows/ai-chat-content-moderation-flow"
import { toast } from "@/hooks/use-toast"
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection } from "@/firebase"
import { collection, query, orderBy, doc, limit, increment } from "firebase/firestore"
import { addDocumentNonBlocking, updateDocumentNonBlocking, setDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates"
import { ThemeToggle } from "@/components/theme-toggle"

// Fully self-contained — owns open state + trigger button
// Parent NEVER re-renders when dialog opens/closes/types
const ShareDialog = React.memo(function ShareDialog({
  profileRef,
  user,
  db,
}: {
  profileRef: React.MutableRefObject<any>
  user: any
  db: any
}) {
  const [open, setOpen] = React.useState(false)
  const [content, setContent] = React.useState("")
  const [isAnonymous, setIsAnonymous] = React.useState(true)
  const [isPosting, setIsPosting] = React.useState(false)

  React.useEffect(() => {
    if (!open) {
      setContent("")
      setIsAnonymous(true)
    }
  }, [open])

  const handlePost = async () => {
    if (!content.trim() || !user || !db) return
    setIsPosting(true)

    const p = profileRef.current
    const authorName = !isAnonymous ? (p?.firstName ? `${p.firstName} ${p.lastName || ''}`.trim() : user.email?.split('@')[0]) : null
    const authorPhotoUrl = !isAnonymous ? p?.photoUrl || null : null
    const authorCourse = !isAnonymous ? p?.course || null : null
    const contentToPost = content

    setContent("")
    setOpen(false)
    setIsPosting(false)

    const postsRef = collection(db, "posts")
    addDocumentNonBlocking(postsRef, {
      content: contentToPost,
      authorId: user.uid,
      authorName,
      authorPhotoUrl,
      authorCourse,
      createdAt: new Date().toISOString(),
      status: "active",
      isAnonymous,
      reactionsCount: { support: 0, relate: 0, encourage: 0, haha: 0 }
    })

    toast({
      title: "Post Shared",
      description: isAnonymous ? "Your voice has been shared anonymously." : "Your post is now live.",
    })

    try {
      const moderation = await moderatePostContent({ postContent: contentToPost })
      if (moderation.isFlagged) {
        const flagsRef = collection(db, "flags")
        addDocumentNonBlocking(flagsRef, {
          studentId: user.uid,
          reason: "AI Moderation",
          details: moderation.reason || "Auto-flagged by AI",
          createdAt: new Date().toISOString(),
          status: "pending"
        })
      }
    } catch {
      // moderation failed silently — post stays live
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          data-share-trigger
          className="rounded-full bg-secondary text-secondary-foreground hover:bg-accent shadow-lg shadow-secondary/10 px-3 h-8 text-xs"
        >
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          <span>Share</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-[400px] border-border bg-popover rounded-2xl p-4">
        <DialogHeader>
          <DialogTitle className="font-headline text-lg text-secondary">Teknoy SafeSpace</DialogTitle>
          <DialogDescription className="text-[10px] text-muted-foreground">
            Choose to share anonymously or show your profile.
          </DialogDescription>
        </DialogHeader>
        <div className="py-2 space-y-4">
          <Textarea
            placeholder="What's on your mind today?"
            className="min-h-[120px] resize-none border-border/50 bg-background focus-visible:ring-secondary/50 text-xs"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/30">
            <div className="flex flex-col">
              <Label htmlFor="anon-toggle" className="text-xs font-bold">{isAnonymous ? "Anonymous Mode" : "Public Mode"}</Label>
              <p className="text-[9px] text-muted-foreground">{isAnonymous ? "Identity is hidden." : "Your profile will be visible."}</p>
            </div>
            <Switch id="anon-toggle" checked={isAnonymous} onCheckedChange={setIsAnonymous} />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => setOpen(false)} className="text-[10px] text-muted-foreground h-8 px-3">Cancel</Button>
          <Button
            size="sm"
            onClick={handlePost}
            disabled={isPosting || !content.trim()}
            className="bg-secondary text-secondary-foreground hover:bg-accent text-[10px] px-4 h-8"
          >
            {isPosting ? "Posting..." : "Share Post"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
})

export default function CommunityFeed() {
  const router = useRouter()
  const { user, isUserLoading } = useUser()
  const db = useFirestore()
  
  const profileRef = useMemoFirebase(() => {
    if (!db || !user?.uid) return null
    return doc(db, "studentProfiles", user.uid)
  }, [db, user?.uid])

  const { data: profile } = useDoc(profileRef)
  // Keep profile in a ref so ShareDialog can read latest value without re-rendering
  const profileDataRef = React.useRef<any>(null)
  React.useEffect(() => { profileDataRef.current = profile }, [profile])

  const postsQuery = useMemoFirebase(() => {
    if (!db) return null
    return query(
      collection(db, "posts"),
      orderBy("createdAt", "desc"),
      limit(50)
    )
  }, [db])

  const { data: posts, isLoading: isPostsLoading } = useCollection(postsQuery)

  const [isMounted, setIsMounted] = React.useState(false)
  React.useEffect(() => {
    setIsMounted(true)
  }, [])

  React.useEffect(() => {
    if (isMounted && !isUserLoading && !user) {
      router.push("/login")
    }
  }, [user, isUserLoading, router, isMounted])

  const handleReact = React.useCallback((postId: string, type: 'support' | 'relate' | 'encourage' | 'haha', currentType?: 'support' | 'relate' | 'encourage' | 'haha' | null) => {
    if (!user || !db) return

    const postRef = doc(db, "posts", postId)
    const reactionRef = doc(db, "posts", postId, "reactions", user.uid)

    if (currentType === type) {
      updateDocumentNonBlocking(postRef, {
        [`reactionsCount.${type}`]: increment(-1)
      })
      deleteDocumentNonBlocking(reactionRef)
      toast({
        title: "Reaction Removed",
        description: `You removed your reaction.`,
      })
    } else if (currentType) {
      updateDocumentNonBlocking(postRef, {
        [`reactionsCount.${currentType}`]: increment(-1),
        [`reactionsCount.${type}`]: increment(1)
      })
      setDocumentNonBlocking(reactionRef, {
        id: user.uid,
        studentId: user.uid,
        postId: postId,
        reactionType: type,
        createdAt: new Date().toISOString()
      }, { merge: true })
      toast({
        title: "Reaction Switched",
        description: `You changed your reaction to ${type}!`,
      })
    } else {
      updateDocumentNonBlocking(postRef, {
        [`reactionsCount.${type}`]: increment(1)
      })
      setDocumentNonBlocking(reactionRef, {
        id: user.uid,
        studentId: user.uid,
        postId: postId,
        reactionType: type,
        createdAt: new Date().toISOString()
      }, { merge: true })
      toast({
        title: "Reaction Sent",
        description: `You reacted with ${type}!`,
      })
    }
  }, [user, db])

  const handleFlag = React.useCallback((postId: string) => {
    if (!user || !db) return
    
    const flagsRef = collection(db, "flags")
    addDocumentNonBlocking(flagsRef, {
      studentId: user.uid,
      postId: postId,
      reason: "User Reported",
      details: "Flagged from community feed",
      createdAt: new Date().toISOString(),
      status: "pending"
    })

    toast({
      title: "Reported",
      description: "Moderators will review this content shortly.",
    })
  }, [user, db])

  if (!isMounted || isUserLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-secondary" />
      </div>
    )
  }

  if (!user) return null

  const postsFeed = (() => {
    if (isPostsLoading) return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-secondary/40" />
        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Loading Feed...</p>
      </div>
    )
    if (posts && posts.length > 0) return posts.map((post: any) => (
      <PostCard
        key={post.id}
        id={post.id}
        content={post.content}
        timestamp={new Date(post.createdAt)}
        reactions={post.reactionsCount || { support: 0, relate: 0, encourage: 0, haha: 0 }}
        isAnonymous={post.isAnonymous}
        authorId={post.authorId}
        authorName={post.authorName}
        authorPhotoUrl={post.authorPhotoUrl}
        onReact={handleReact}
        onFlag={handleFlag}
      />
    ))
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center gap-4 border border-dashed border-border/40 rounded-3xl bg-card/10">
        <MessageSquareOff className="h-10 w-10 text-muted-foreground/20" />
        <div>
          <h3 className="text-sm font-bold text-foreground">The feed is quiet</h3>
          <p className="text-[10px] text-muted-foreground max-w-[200px] mt-1 mx-auto">Be the first to share a thought in Teknoy SafeSpace.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => document.querySelector<HTMLButtonElement>('[data-share-trigger]')?.click()} className="h-8 text-[10px] rounded-full border-secondary/30 text-secondary hover:bg-secondary/10">
          Start Conversation
        </Button>
      </div>
    )
  })()

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background">
        <header className="sticky top-0 z-30 flex h-14 items-center border-b border-border/40 bg-background/80 px-4 backdrop-blur-md">
          <SidebarTrigger />
          <div className="ml-2 flex items-center gap-2">
            <h1 className="font-headline text-base font-bold tracking-tight text-secondary">Feed</h1>
          </div>
          <div className="ml-auto flex items-center gap-2">
             <ThemeToggle />
             <ShareDialog
               profileRef={profileDataRef}
               user={user}
               db={db}
             />
          </div>
        </header>

        <main className="mx-auto w-full max-xl px-4 py-6 md:px-6">
          <div className="space-y-4 pb-16">
            {postsFeed}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
