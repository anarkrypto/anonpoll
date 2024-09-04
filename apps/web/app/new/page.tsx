'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { ArrowRight } from 'lucide-react'

export default function PollNameForm() {
  const [pollName, setPollName] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (pollName.trim() === '') {
      setError('Poll name cannot be empty')
      return
    }
    // Encode the poll name to handle special characters in the URL
    const encodedPollName = encodeURIComponent(pollName.trim())
    router.push(`/new/${encodedPollName}`)
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">Create a New Poll</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pollName">Poll Name</Label>
              <Input
                id="pollName"
                type="text"
                placeholder="Enter your poll name"
                value={pollName}
                onChange={(e) => {
                  setPollName(e.target.value)
                  setError('')
                }}
              />
              {error && <p className="text-sm text-red-500">{error}</p>}
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full">
            Next
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}