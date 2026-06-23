"use client"

import * as React from "react"
import { Phone, ExternalLink, Compass, Search, Mail, Library, Sparkles, BookOpen, Music } from "lucide-react"
import Image from "next/image"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PlaceHolderImages } from "@/lib/placeholder-images"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const RESOURCES = [
  {
    id: 1,
    title: "Mental Health PH",
    category: "Crisis",
    description: "Confidential support available 24/7 for anyone in distress.",
    contact: "0917-899-8727",
    type: "Hotline",
    stressTarget: ["High", "Moderate"]
  },
  {
    id: 2,
    title: "CIT-U Counseling Services",
    category: "School",
    description: "Professional counseling for enrolled wildcats. Reach out to the guidance team.",
    contact: "(032) 411 2000",
    email: "guidance@cit.edu",
    type: "Service",
    stressTarget: ["Low", "Moderate", "High"]
  },
  {
    id: 3,
    title: "Meditate Maxxing",
    category: "Self-Help",
    description: "A 10-minute session to center yourself and reduce academic anxiety.",
    contact: "Watch Video",
    url: "https://youtu.be/2VXXa_x8pBs?si=W3m-DJuf2EZ12ez2",
    type: "Tip",
    image: PlaceHolderImages[0],
    stressTarget: ["Low", "Moderate"]
  },
  {
    id: 4,
    title: "Time Management for Students",
    category: "Self-Help",
    description: "Practical strategies to balance heavy course loads and personal life.",
    contact: "Read Guide",
    url: "https://learningcenter.unc.edu/tips-and-tools/time-management/",
    type: "Tip",
    image: PlaceHolderImages[2],
    stressTarget: ["Low", "Moderate"]
  },
  {
    id: 5,
    title: "Read Manga",
    category: "Self-Help",
    description: "De-stress and escape into different worlds after a long day.",
    contact: "Explore Manga",
    url: "https://asurascanz.com/?2026-03-19",
    type: "Tip",
    image: PlaceHolderImages[3],
    stressTarget: ["Low", "Moderate"]
  },
  {
    id: 6,
    title: "Listening Music",
    category: "Self-Help",
    description: "Listen to ur niche favorite music artist in spotify to calm and relax your mood.",
    contact: "Listen Now",
    url: "https://open.spotify.com/",
    type: "Tip",
    image: PlaceHolderImages[4],
    stressTarget: ["Low", "Moderate"]
  }
]

export default function ResourceLibrary() {
  const [userStress, setUserStress] = React.useState<string | null>(null)
  const [searchQuery, setSearchQuery] = React.useState("")

  React.useEffect(() => {
    const history = JSON.parse(localStorage.getItem('stress_history') || '[]')
    if (history.length > 0) {
      setUserStress(history[history.length - 1].level)
    }
  }, [])

  const filteredResources = React.useMemo(() => {
    const query = searchQuery.toLowerCase().trim()
    if (!query) return RESOURCES

    return RESOURCES.filter(res => 
      res.title.toLowerCase().includes(query) ||
      res.description.toLowerCase().includes(query) ||
      res.category.toLowerCase().includes(query)
    )
  }, [searchQuery])

  const recommendedResources = React.useMemo(() => {
    if (!userStress) return []
    return filteredResources.filter(r => r.stressTarget.includes(userStress))
  }, [userStress, filteredResources])

  const defaultTab = userStress && recommendedResources.length > 0 ? "recommended" : "all"

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-background">
        <header className="sticky top-0 z-30 flex h-14 items-center border-b border-border/40 bg-background/80 px-4 backdrop-blur-md">
          <SidebarTrigger />
          <h1 className="ml-2 font-headline text-sm font-bold tracking-tight text-secondary">Library</h1>
        </header>

        <main className="mx-auto w-full max-w-6xl px-4 py-6 md:px-6">
          <div className="mb-8 flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2 text-secondary mb-1">
                <Library className="h-5 w-5" />
                <h2 className="font-headline text-xl font-bold tracking-tight text-foreground">Wellness Tools</h2>
              </div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Curated Resources for CIT-U Students</p>
            </div>
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input 
                placeholder="Search tools, topics..." 
                className="pl-9 border-border/50 bg-card/40 rounded-full h-9 text-xs focus-visible:ring-secondary/50"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <Tabs defaultValue={defaultTab} className="space-y-6">
            <div className="overflow-x-auto pb-1">
              <TabsList className="inline-flex h-9 w-auto bg-card/40 border border-border/40 p-1">
                {userStress && recommendedResources.length > 0 && (
                  <TabsTrigger value="recommended" className="text-[10px] px-4 font-bold uppercase tracking-wider h-7 gap-1.5 data-[state=active]:text-secondary">
                    <Sparkles className="h-3 w-3" />
                    For You
                  </TabsTrigger>
                )}
                <TabsTrigger value="all" className="text-[10px] px-4 font-bold uppercase tracking-wider h-7">All</TabsTrigger>
                <TabsTrigger value="crisis" className="text-[10px] px-4 font-bold uppercase tracking-wider h-7">Crisis</TabsTrigger>
                <TabsTrigger value="school" className="text-[10px] px-4 font-bold uppercase tracking-wider h-7">School</TabsTrigger>
                <TabsTrigger value="self-help" className="text-[10px] px-4 font-bold uppercase tracking-wider h-7">Tips</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="recommended" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
               {recommendedResources.map(res => (
                 <ResourceCard key={`recommended-${res.id}`} resource={res} highlighted />
               ))}
            </TabsContent>

            <TabsContent value="all" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-0">
               {filteredResources.length > 0 ? (
                 filteredResources.map(res => (
                   <ResourceCard key={`all-${res.id}`} resource={res} />
                 ))
               ) : (
                 <div className="col-span-full py-12 text-center text-muted-foreground bg-card/20 rounded-xl border border-dashed border-border/40">
                   <p className="text-sm italic">No resources found matching "{searchQuery}"</p>
                 </div>
               )}
            </TabsContent>
            
            <TabsContent value="crisis" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-0">
               {filteredResources.filter(r => r.category === 'Crisis').length > 0 ? (
                 filteredResources.filter(r => r.category === 'Crisis').map(res => (
                   <ResourceCard key={`crisis-${res.id}`} resource={res} />
                 ))
               ) : (
                 <div className="col-span-full py-12 text-center text-muted-foreground bg-card/20 rounded-xl border border-dashed border-border/40">
                    <p className="text-sm italic">No crisis resources available.</p>
                 </div>
               )}
            </TabsContent>

            <TabsContent value="school" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-0">
               {filteredResources.filter(r => r.category === 'School').length > 0 ? (
                 filteredResources.filter(r => r.category === 'School').map(res => (
                   <ResourceCard key={`school-${res.id}`} resource={res} />
                 ))
               ) : (
                 <div className="col-span-full py-12 text-center text-muted-foreground bg-card/20 rounded-xl border border-dashed border-border/40">
                    <p className="text-sm italic">No school services found.</p>
                 </div>
               )}
            </TabsContent>

            <TabsContent value="self-help" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-0">
               {filteredResources.filter(r => r.category === 'Self-Help').length > 0 ? (
                 filteredResources.filter(r => r.category === 'Self-Help').map(res => (
                   <ResourceCard key={`self-help-${res.id}`} resource={res} />
                 ))
               ) : (
                 <div className="col-span-full py-12 text-center text-muted-foreground bg-card/20 rounded-xl border border-dashed border-border/40">
                    <p className="text-sm italic">No self-help tips found.</p>
                 </div>
               )}
            </TabsContent>
          </Tabs>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}

function ResourceCard({ resource, highlighted }: { resource: any; highlighted?: boolean }) {
  const isExternal = resource.url && resource.url.startsWith('http');
  
  const telHref = (resource.type === 'Hotline' || (resource.type === 'Service' && resource.contact && /\d/.test(resource.contact)))
    ? `tel:${resource.contact.replace(/\D/g, '')}` 
    : null;
    
  const mainHref = telHref || resource.url || '#';

  return (
    <Card className={cn(
      "group overflow-hidden border-border/40 bg-card/60 rounded-xl transition-all hover:border-secondary/30",
      highlighted && "ring-1 ring-secondary/20 shadow-lg shadow-secondary/5"
    )}>
      {resource.image && (
        <div className="relative aspect-[16/9] w-full overflow-hidden border-b border-border/20">
          <Image 
            src={resource.image.imageUrl} 
            alt={resource.image.description} 
            fill 
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            data-ai-hint={resource.image.imageHint}
          />
          {highlighted && (
            <div className="absolute top-2 right-2">
              <Badge className="bg-secondary text-secondary-foreground text-[8px] font-bold px-2 py-0.5 shadow-md">RECOMENDED</Badge>
            </div>
          )}
        </div>
      )}
      <CardHeader className="p-4 space-y-2">
        <div className="flex items-center justify-between">
           <Badge variant="outline" className="border-secondary/30 bg-secondary/10 text-secondary font-bold text-[8px] uppercase tracking-wider px-2 py-0 h-4">
             {resource.category}
           </Badge>
           <span className="text-[8px] text-muted-foreground uppercase font-bold tracking-tighter">{resource.type}</span>
        </div>
        <CardTitle className="font-headline text-base leading-tight group-hover:text-secondary transition-colors">{resource.title}</CardTitle>
        <CardDescription className="text-xs line-clamp-2 leading-relaxed text-foreground/70">{resource.description}</CardDescription>
      </CardHeader>
      <CardFooter className="p-4 pt-0 flex flex-col gap-2">
        <Button variant="outline" size="sm" className="w-full border-border/50 bg-background/50 hover:bg-secondary/10 hover:border-secondary/50 text-[10px] h-9 font-bold transition-all active:scale-[0.98]" asChild>
          <a 
            href={mainHref}
            target={!telHref && isExternal ? "_blank" : undefined}
            rel={!telHref && isExternal ? "noopener noreferrer" : undefined}
          >
            {telHref ? <Phone className="mr-2 h-3.5 w-3.5" /> : (resource.title.includes("Manga") ? <BookOpen className="mr-2 h-3.5 w-3.5" /> : (resource.title.includes("Music") || resource.title.includes("Melody") ? <Music className="mr-2 h-3.5 w-3.5" /> : <ExternalLink className="mr-2 h-3.5 w-3.5" />))}
            {resource.contact}
          </a>
        </Button>
        {resource.email && (
          <Button variant="outline" size="sm" className="w-full border-border/50 bg-background/50 hover:bg-secondary/10 hover:border-secondary/50 text-[10px] h-9 font-bold transition-all active:scale-[0.98]" asChild>
            <a href={`mailto:${resource.email}`}>
              <Mail className="mr-2 h-3.5 w-3.5" />
              {resource.email}
            </a>
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
