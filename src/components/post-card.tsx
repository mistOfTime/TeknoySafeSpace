"use client"

import * as React from "react"
import { Heart, ShieldAlert, ShieldCheck, Sparkles, ThumbsUp, User, GraduationCap } from "lucide-react"
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

const HahaEmoji = ({ active }: { active?: boolean }) => (
  <svg 
    viewBox="0 0 24 24" 
    className={cn("h-3 w-3 shrink-0 transition-transform", active && "scale-110")}
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Head */}
    <circle cx="12" cy="12" r="10" fill={active ? "#FBBF24" : "currentColor"} fillOpacity={active ? "1" : "0.2"} stroke={active ? "#D97706" : "currentColor"} strokeWidth="1.5"/>
    
    {/* Laughing Eyes (Classic > < squint) */}
    <path 
      d="M8 9L10 11L8 13" 
      stroke={active ? "#92400E" : "currentColor"} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
    />
    <path 
      d="M16 9L14 11L16 13" 
      stroke={active ? "#92400E" : "currentColor"} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
    />
    
    {/* Big Laughing Mouth */}
    <path 
      d="M7 15C7 17.5 9.23858 19 12 19C14.7614 19 17 17.5 17 15H7Z" 
      fill={active ? "#92400E" : "currentColor"}
      fillOpacity={active ? "1" : "0.4"}
      stroke={active ? "#92400E" : "currentColor"} 
      strokeWidth="1.5" 
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

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
      <CardFooter className="grid grid-cols-4 items-center gap-1 border-t border-border/20 p-2 px-3 bg-muted/5 sm:flex sm:flex-wrap sm:w-auto">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => onReact(id, 'support', userReaction)}
          className={cn(
            "h-7 rounded-full border-border/50 bg-background/50 text-[9px] px-1.5 transition-all w-full sm:w-auto sm:px-3",
            userReaction === 'support' 
              ? "bg-rose-500/20 text-rose-500 border-rose-500/50 shadow-sm" 
              : "hover:bg-primary/10 hover:text-secondary"
          )}
        >
          <Heart className={cn("mr-1 h-3 w-3 shrink-0", userReaction === 'support' ? "fill-current" : "")} />
          <span className="truncate">Support {reactions.support || 0}</span>
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => onReact(id, 'relate', userReaction)}
          className={cn(
            "h-7 rounded-full border-border/50 bg-background/50 text-[9px] px-1.5 transition-all w-full sm:w-auto sm:px-3",
            userReaction === 'relate' 
              ? "bg-amber-500/20 text-amber-500 border-amber-500/50 shadow-sm" 
              : "hover:bg-primary/10 hover:text-secondary"
          )}
        >
          <Sparkles className={cn("mr-1 h-3 w-3 shrink-0", userReaction === 'relate' ? "fill-current" : "")} />
          <span className="truncate">Relate {reactions.relate || 0}</span>
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => onReact(id, 'encourage', userReaction)}
          className={cn(
            "h-7 rounded-full border-border/50 bg-background/50 text-[9px] px-1.5 transition-all w-full sm:w-auto sm:px-3",
            userReaction === 'encourage' 
              ? "bg-emerald-500/20 text-emerald-500 border-emerald-500/50 shadow-sm" 
              : "hover:bg-primary/10 hover:text-secondary"
          )}
        >
          <ThumbsUp className={cn("mr-1 h-3 w-3 shrink-0", userReaction === 'encourage' ? "fill-current" : "")} />
          <span className="truncate">Like {reactions.encourage || 0}</span>
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => onReact(id, 'haha', userReaction)}
          className={cn(
            "h-7 rounded-full border-border/50 bg-background/50 text-[9px] px-1.5 transition-all w-full sm:w-auto sm:px-3",
            userReaction === 'haha' 
              ? "bg-amber-100/40 text-amber-600 border-amber-300 shadow-sm" 
              : "hover:bg-primary/10 hover:text-secondary"
          )}
        >
          <HahaEmoji active={userReaction === 'haha'} />
          <span className="ml-1 truncate">Haha {reactions.haha || 0}</span>
        </Button>
      </CardFooter>
    </Card>
  )
}
