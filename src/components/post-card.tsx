"use client"

import * as React from "react"
import { ShieldAlert, ShieldCheck, User, GraduationCap } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { useFirestore, useDoc, useMemoFirebase, useUser } from "@/firebase"
import { doc } from "firebase/firestore"

interface PostCardProps {
  id: string
  content: string
  timestamp: Date
  reactions: {
    support: number
    relate: number
    encourage: number
    haha: number
  }
  isAnonymous: boolean
  authorId?: string
  authorName?: string
  authorPhotoUrl?: string
  onReact: (id: string, type: 'support' | 'relate' | 'encourage' | 'haha', currentType?: 'support' | 'relate' | 'encourage' | 'haha' | null) => void
  onFlag: (id: string) => void
}

type ReactionType = 'support' | 'relate' | 'encourage' | 'haha'

const REACTIONS: {
  type: ReactionType
  emoji: string
  label: string
  activeClass: string
  particleColor: string
}[] = [
  {
    type: 'support',
    emoji: '❤️',
    label: 'Love',
    activeClass: 'bg-rose-500/20 text-rose-500 border-rose-500/50 shadow-sm',
    particleColor: '#f43f5e',
  },
  {
    type: 'haha',
    emoji: '😂',
    label: 'Haha',
    activeClass: 'bg-amber-400/20 text-amber-500 border-amber-400/50 shadow-sm',
    particleColor: '#f59e0b',
  },
  {
    type: 'relate',
    emoji: '😮',
    label: 'Wow',
    activeClass: 'bg-sky-400/20 text-sky-500 border-sky-400/50 shadow-sm',
    particleColor: '#38bdf8',
  },
  {
    type: 'encourage',
    emoji: '👍',
    label: 'Like',
    activeClass: 'bg-blue-500/20 text-blue-500 border-blue-500/50 shadow-sm',
    particleColor: '#3b82f6',
  },
]

interface FloatingEmoji {
  id: number
  emoji: string
  x: number
}

function useFloatingEmojis() {
  const [floaters, setFloaters] = React.useState<FloatingEmoji[]>([])
  const counterRef = React.useRef(0)

  const burst = React.useCallback((emoji: string) => {
    const count = 6
    const newFloaters: FloatingEmoji[] = Array.from({ length: count }, (_, i) => ({
      id: counterRef.current++,
      emoji,
      x: (i - (count - 1) / 2) * 22 + (Math.random() - 0.5) * 10,
    }))
    setFloaters(prev => [...prev, ...newFloaters])
    setTimeout(() => {
      setFloaters(prev => prev.filter(f => !newFloaters.find(n => n.id === f.id)))
    }, 900)
  }, [])

  return { floaters, burst }
}

export function PostCard({ 
  id, 
  content, 
  timestamp, 
  reactions, 
  isAnonymous,
  authorId,
  authorName,
  authorPhotoUrl,
  onReact, 
  onFlag 
}: PostCardProps) {
  const [isProfileOpen, setIsProfileOpen] = React.useState(false)
  const { floaters, burst } = useFloatingEmojis()
  const [bouncingReaction, setBouncingReaction] = React.useState<ReactionType | null>(null)

  const handleReact = (type: ReactionType, currentUserReaction: ReactionType | null | undefined) => {
    const reaction = REACTIONS.find(r => r.type === type)
    if (reaction && currentUserReaction !== type) {
      burst(reaction.emoji)
      setBouncingReaction(type)
      setTimeout(() => setBouncingReaction(null), 400)
    }
    onReact(id, type, currentUserReaction)
  }
  const db = useFirestore()
  const { user } = useUser()
  
  const authorProfileRef = useMemoFirebase(() => {
    if (!db || !authorId) return null
    return doc(db, "studentProfiles", authorId)
  }, [db, authorId])

  const authorAdminRef = useMemoFirebase(() => {
    if (!db || !authorId) return null
    return doc(db, "roles_admin", authorId)
  }, [db, authorId])

  const { data: authorProfile } = useDoc(authorProfileRef)
  const { data: authorAdmin } = useDoc(authorAdminRef)
  const isAuthorAdmin = !!authorAdmin

  // Always use live profile data — falls back to post snapshot only if profile not loaded yet
  const livePhotoUrl = authorProfile?.photoUrl || authorPhotoUrl
  const liveFirstName = authorProfile?.firstName
  const liveLastName = authorProfile?.lastName
  const liveName = liveFirstName
    ? `${liveFirstName} ${liveLastName || ''}`.trim()
    : authorName
  const liveInitials = liveName ? liveName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) : '?'

  const myReactionRef = useMemoFirebase(() => {
    if (!db || !id || !user?.uid) return null
    return doc(db, "posts", id, "reactions", user.uid)
  }, [db, id, user?.uid])

  const { data: myReaction } = useDoc(myReactionRef)
  const userReaction = myReaction?.reactionType as 'support' | 'relate' | 'encourage' | 'haha' | undefined | null

  const authorDisplay = (
    <div className="flex items-center gap-2">
      <Avatar className="h-8 w-8 border border-secondary/20 bg-secondary/10">
        <AvatarImage src={livePhotoUrl} className="object-cover" />
        <AvatarFallback className="text-[10px] font-bold text-secondary">{liveInitials}</AvatarFallback>
      </Avatar>
      <div className="flex flex-col">
        <div className="flex items-center gap-1">
          <span className="text-[10px] font-bold text-foreground uppercase tracking-widest hover:text-secondary transition-colors cursor-pointer">
            {liveName || 'Student'}
          </span>
          {isAuthorAdmin && (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[8px] font-bold text-emerald-500 border border-emerald-500/30">
              <ShieldCheck className="h-2.5 w-2.5" /> ADMIN
            </span>
          )}
        </div>
        <span className="text-[9px] text-muted-foreground/60">
          {formatDistanceToNow(timestamp, { addSuffix: true })}
        </span>
      </div>
    </div>
  )

  return (
    <Card className="group relative border-border/40 bg-card/60 backdrop-blur-sm transition-all hover:shadow-lg hover:shadow-primary/5 overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between p-3 pb-2 space-y-0">
        <div className="flex items-center gap-2">
          {isAnonymous ? (
            <div className="flex items-center gap-2">
               <div className="h-8 w-8 rounded-full bg-muted/20 border border-border/20 flex items-center justify-center">
                  <User className="h-4 w-4 text-muted-foreground/40" />
               </div>
               <div className="flex flex-col">
                <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest italic">Anonymous Wildcat</span>
                <span className="text-[9px] text-muted-foreground/40">
                  {formatDistanceToNow(timestamp, { addSuffix: true })}
                </span>
              </div>
            </div>
          ) : (
            <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
              <DialogTrigger asChild>
                <div className="cursor-pointer">
                  {authorDisplay}
                </div>
              </DialogTrigger>
              <DialogContent className="max-w-[320px] rounded-2xl border-border/40 bg-card/95 backdrop-blur-xl p-0 overflow-hidden shadow-2xl ring-1 ring-secondary/20">
                <div className="px-6 py-8 flex flex-col items-center text-center">
                  <Avatar className="h-20 w-20 border-2 border-secondary/20 bg-secondary/10 shadow-xl mb-4">
                    <AvatarImage src={livePhotoUrl} className="object-cover" />
                    <AvatarFallback className="text-2xl font-bold text-secondary">{liveInitials}</AvatarFallback>
                  </Avatar>
                  <div className="space-y-1.5">
                    <h3 className="font-headline text-lg font-bold text-foreground">
                      {liveName || 'Student'}
                    </h3>
                    {isAuthorAdmin && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-1 text-[9px] font-bold text-emerald-500 border border-emerald-500/30">
                        <ShieldCheck className="h-3 w-3" /> ADMIN
                      </span>
                    )}
                    {authorProfile?.course && (
                      <p className="text-xs text-muted-foreground">{authorProfile.course}</p>
                    )}
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary/10 border border-secondary/20 text-secondary">
                      <GraduationCap className="h-3.5 w-3.5" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">
                        ID: {authorProfile?.studentIdNumber || 'Verified Student'}
                      </span>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
              <ShieldAlert className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-popover border-border">
            <DropdownMenuItem 
              onClick={() => onFlag(id)}
              className="text-xs text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer"
            >
              <ShieldAlert className="mr-2 h-3.5 w-3.5" />
              Flag for Review
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="p-3 pt-0 pb-3">
        <p className="font-body text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">
          {content}
        </p>
      </CardContent>
      <CardFooter className="relative grid grid-cols-4 items-center gap-1 border-t border-border/20 p-2 px-3 bg-muted/5 sm:flex sm:flex-wrap sm:w-auto overflow-visible">
        {/* Floating emoji burst layer */}
        <div className="pointer-events-none absolute inset-0 overflow-visible" aria-hidden>
          {floaters.map(f => (
            <span
              key={f.id}
              className="absolute bottom-6 left-1/2 text-lg select-none animate-float-up"
              style={{
                transform: `translateX(calc(-50% + ${f.x}px))`,
              }}
            >
              {f.emoji}
            </span>
          ))}
        </div>

        {REACTIONS.map(({ type, emoji, label, activeClass }) => {
          const isActive = userReaction === type
          const count = reactions[type] || 0
          return (
            <Button
              key={type}
              variant="outline"
              size="sm"
              onClick={() => handleReact(type, userReaction)}
              className={cn(
                "h-7 rounded-full border-border/50 bg-background/50 text-[9px] px-1.5 transition-all w-full sm:w-auto sm:px-3 select-none",
                isActive ? activeClass : "hover:bg-primary/10 hover:text-secondary"
              )}
            >
              <span
                className={cn(
                  "mr-1 text-sm leading-none transition-transform duration-300",
                  isActive && bouncingReaction === type && "animate-reaction-bounce",
                  isActive && "scale-110"
                )}
              >
                {emoji}
              </span>
              <span className="truncate">{label} {count}</span>
            </Button>
          )
        })}
      </CardFooter>
    </Card>
  )
}
