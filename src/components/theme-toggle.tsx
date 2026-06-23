"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const [theme, setTheme] = React.useState<"light" | "dark">("dark")
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null
    const root = window.document.documentElement
    
    if (savedTheme) {
      setTheme(savedTheme)
      if (savedTheme === "dark") {
        root.classList.add("dark")
      } else {
        root.classList.remove("dark")
      }
    } else {
      // Default to dark mode for CIT-U aesthetic
      root.classList.add("dark")
      setTheme("dark")
      localStorage.setItem("theme", "dark")
    }
  }, [])

  const toggleTheme = () => {
    const root = window.document.documentElement
    const newTheme = theme === "light" ? "dark" : "light"
    
    if (newTheme === "dark") {
      root.classList.add("dark")
    } else {
      root.classList.remove("dark")
    }
    
    setTheme(newTheme)
    localStorage.setItem("theme", newTheme)
  }

  if (!mounted) {
    return <div className="h-9 w-9" />
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="h-9 w-9 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
    >
      {theme === "light" ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}