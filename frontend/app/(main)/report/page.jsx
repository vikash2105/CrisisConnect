"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button.jsx"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.jsx"
import { Input } from "@/components/ui/input.jsx"
import { Label } from "@/components/ui/label.jsx"
import { Textarea } from "@/components/ui/textarea.jsx"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.jsx"
import { Progress } from "@/components/ui/progress.jsx"
import { useToast } from "@/hooks/use-toast.js"
import { Footer } from "@/components/footer.jsx"
import { AlertTriangle, Upload, MapPin, Loader2, CheckCircle, Camera, ArrowLeft, Mic, Clock } from "lucide-react"
import Link from "next/link"
import dynamic from "next/dynamic"

// Dynamically import LocationSelectorMap
const LocationSelectorMap = dynamic(() => import("@/components/LocationSelectorMap.jsx"), {
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin" />
      <span className="ml-2">Loading Map...</span>
    </div>
  ),
})

const emergencyCategories = [
  { value: "Fire", label: "Fire", icon: "🔥" },
  { value: "Flood", label: "Flood", icon: "🌊" },
  { value: "Power Outage", label: "Power Outage", icon: "⚡" },
  { value: "Accident", label: "Accident", icon: "🚗" },
  { value: "Medical Emergency", label: "Medical Emergency", icon: "🏥" },
  { value: "Blood Donation", label: "Blood Donation", icon: "🩸" },
  { value: "Food & Water Aid", label: "Food & Water Aid", icon: "🥫" },
  { value: "Shelter Help", label: "Shelter Help", icon: "🏠" },
  { value: "Elderly Support", label: "Elderly Support", icon: "🧓" },
  { value: "Lost Pet", label: "Lost Pet", icon: "🐾" },
  { value: "Cleanup Drive", label: "Cleanup Drive", icon: "🧹" },
  { value: "Community Support", label: "Community Support", icon: "🤝" },
  { value: "Other", label: "Other", icon: "⚠️" },
]

export default function ReportPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [formData, setFormData] = useState({
    category: "",
    description: "",
    address: "",
    media: null, // File | null
    coordinates: null, // [lng, lat] | null
  })

  // Voice recording
  const [isRecording, setIsRecording] = useState(false)
  const recognitionRef = useRef(null)
  const [selectedLocation, setSelectedLocation] = useState(null) // { lat, lng, address } | null

  const handleVoiceInput = () => {
    if (isRecording) {
      recognitionRef.current?.stop()
      setIsRecording(false)
      return
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      toast({
        title: "Browser Not Supported",
        description: "Your browser does not support the Web Speech API for voice recognition.",
        variant: "destructive",
      })
      return
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = "en-US"
    recognitionRef.current = recognition

    recognition.onstart = () => {
      setIsRecording(true)
      toast({ title: "Listening...", description: "Start speaking to describe the incident." })
    }

    recognition.onend = () => {
      setIsRecording(false)
      toast({ title: "Recording stopped." })
    }

    recognition.onerror = (event) => {
      toast({ title: "Voice Recognition Error", description: event.error, variant: "destructive" })
      setIsRecording(false)
    }

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0])
        .map((result) => result.transcript)
        .join("")
      setFormData((prev) => ({ ...prev, description: transcript }))
    }

    recognition.start()
  }

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop()
    }
  }, [])

  const handleLocationSelect = (lat, lng, address) => {
    setSelectedLocation({ lat, lng, address })
    setFormData((prev) => ({ ...prev, address, coordinates: [lng, lat] }))
  }

  // Reflect typed address on the map by debounced geocoding
  useEffect(() => {
    const addr = formData.address?.trim()
    if (!addr) return

    const handle = setTimeout(async () => {
      try {
        const geocodeUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addr)}&limit=1`
        const res = await fetch(geocodeUrl, { headers: { "User-Agent": "CrisisConnect App" } })
        const data = await res.json()

        if (Array.isArray(data) && data.length > 0 && data[0]?.lat && data[0]?.lon) {
          const lat = parseFloat(data[0].lat)
          const lng = parseFloat(data[0].lon)
          const display = data[0].display_name || addr

          setSelectedLocation({ lat, lng, address: display })
          setFormData((prev) => ({ ...prev, coordinates: [lng, lat] }))
        }
      } catch {
        // ignore
      }
    }, 600)

    return () => clearTimeout(handle)
  }, [formData.address])

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.category || !formData.description || !formData.address) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const token = localStorage.getItem("token")
      if (!token) throw new Error("You must be logged in to submit a report.")

      // Coordinates: use selected or geocode
      let coordinates
      if (formData.coordinates) {
        coordinates = formData.coordinates
      } else {
        const geocodeUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          formData.address
        )}&limit=1`
        const geoResponse = await fetch(geocodeUrl, { headers: { "User-Agent": "CrisisConnect App" } })
        const geoData = await geoResponse.json()
        if (!geoData || geoData.length === 0) {
          throw new Error("Could not verify the address. Please click on the map to select a location.")
        }
        const { lat, lon } = geoData[0]
        coordinates = [parseFloat(lon), parseFloat(lat)]
      }

      const dataToSubmit = new FormData()
      dataToSubmit.append("category", formData.category)
      dataToSubmit.append("description", formData.description)
      dataToSubmit.append("address", formData.address)
      dataToSubmit.append("coordinates", JSON.stringify(coordinates))
      if (formData.media) dataToSubmit.append("media", formData.media)

      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
      const response = await fetch(`${API_URL}/api/incidents`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: dataToSubmit,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to submit the report.")
      }

      setIsSuccess(true)
      setTimeout(() => {
        toast({ title: "Report Submitted Successfully", description: "Your emergency report has been sent." })
        router.push("/")
      }, 1500)
    } catch (error) {
      toast({
        title: "Submission Failed",
        description: error?.message || "An unexpected error occurred.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleMediaUpload = (e) => {
    const file = e.target.files?.[0]
    if (file) setFormData((prev) => ({ ...prev, media: file }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/10">
      {/* Background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ x: [0, 20, 0], y: [0, -15, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-20 left-10 w-32 h-32 bg-primary/5 rounded-full"
        />
        <motion.div
          animate={{ x: [0, -25, 0], y: [0, 20, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 3 }}
          className="absolute top-40 right-20 w-24 h-24 bg-secondary/5 rounded-full"
        />
        <motion.div
          animate={{ x: [0, 15, 0], y: [0, -10, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 6 }}
          className="absolute bottom-32 left-1/4 w-20 h-20 bg-accent/5 rounded-full"
        />
      </div>

      <main className="container mx-auto px-4 py-8 relative z-10">
        {/* Back Button */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }} className="mb-6">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link href="/">
              <Button variant="ghost" className="text-muted-foreground hover:text-foreground hover:bg-accent/10 transition-all duration-200 focus-ring">
                <motion.div whileHover={{ x: -2 }} transition={{ type: "spring", stiffness: 400 }}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                </motion.div>
                Back to Dashboard
              </Button>
            </Link>
          </motion.div>
        </motion.div>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-center mb-12 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-secondary/5 to-accent/5 rounded-3xl opacity-50 animate-gradient" />
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring", stiffness: 200 }} className="relative z-10">
            <div className="flex items-center justify-center mb-6">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="p-4 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 shadow-lg"
              >
                <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}>
                  <AlertTriangle className="h-12 w-12 text-primary" />
                </motion.div>
              </motion.div>
            </div>

            <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="text-4xl md:text-5xl font-bold text-foreground mb-4 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              Report Emergency
            </motion.h1>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="max-w-3xl mx-auto">
              <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                Help your community by reporting emergencies quickly and accurately.
                <span className="block mt-2 font-medium text-accent">Your report will be sent to local authorities and volunteers for immediate response.</span>
              </p>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Form */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="max-w-3xl mx-auto">
          <Card className="bg-card border-border hover-lift relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-30" />

            <CardHeader className="relative z-10">
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="flex items-center gap-3">
                <motion.div
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="p-2 bg-primary/10 rounded-full"
                >
                  <AlertTriangle className="h-6 w-6 text-primary" />
                </motion.div>
                <CardTitle className="text-2xl font-bold text-foreground">Emergency Details</CardTitle>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <CardDescription className="text-muted-foreground text-base">
                  Please provide as much detail as possible to help responders understand the situation quickly
                </CardDescription>

                <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.4 }} className="mt-4">
                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                    <span>Form Progress</span>
                    <span className="font-medium">
                      {Math.round(
                        ((formData.category ? 1 : 0) + (formData.description ? 1 : 0) + (formData.address ? 1 : 0)) / 3 * 100
                      )}
                      %
                    </span>
                  </div>
                  <Progress
                    value={
                      ((formData.category ? 1 : 0) + (formData.description ? 1 : 0) + (formData.address ? 1 : 0)) / 3 * 100
                    }
                    className="h-2"
                  />
                </motion.div>
              </motion.div>
            </CardHeader>

            <CardContent className="relative z-10">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Category */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="category" className="text-foreground font-semibold">
                      Emergency Category *
                    </Label>
                    <motion.div
                      animate={{ scale: formData.category ? [1, 1.2, 1] : 1 }}
                      className={`w-2 h-2 rounded-full ${formData.category ? "bg-green-500" : "bg-muted-foreground"}`}
                    />
                  </div>

                  <Select value={formData.category} onValueChange={(value) => setFormData((p) => ({ ...p, category: value }))}>
                    <SelectTrigger className="bg-input border-border hover:border-primary/50 focus:border-primary transition-colors h-12">
                      <SelectValue placeholder="Select emergency type" />
                    </SelectTrigger>
                    <SelectContent>
                      {emergencyCategories.map((category, index) => (
                        <motion.div key={category.value} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }}>
                          <SelectItem value={category.value} className="hover:bg-accent/10 focus:bg-accent/20">
                            <div className="flex items-center gap-3 py-1">
                              <motion.span whileHover={{ scale: 1.2, rotate: 10 }} className="text-lg">
                                {category.icon}
                              </motion.span>
                              <span className="font-medium">{category.label}</span>
                            </div>
                          </SelectItem>
                        </motion.div>
                      ))}
                    </SelectContent>
                  </Select>
                </motion.div>

                {/* Description */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="description" className="text-foreground font-semibold">
                        Description *
                      </Label>
                      <motion.div
                        animate={{ scale: formData.description ? [1, 1.2, 1] : 1 }}
                        className={`w-2 h-2 rounded-full ${formData.description ? "bg-green-500" : "bg-muted-foreground"}`}
                      />
                    </div>

                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={handleVoiceInput}
                        className={`h-10 w-10 rounded-full transition-all duration-200 ${
                          isRecording ? "bg-destructive/10 border-2 border-destructive animate-pulse" : "hover:bg-accent/10 hover:border-accent"
                        }`}
                      >
                        <motion.div animate={isRecording ? { scale: [1, 1.2, 1] } : { scale: 1 }} transition={{ duration: 1, repeat: isRecording ? Infinity : 0 }}>
                          <Mic className={`h-5 w-5 ${isRecording ? "text-destructive" : "text-muted-foreground hover:text-accent"}`} />
                        </motion.div>
                      </Button>
                    </motion.div>
                  </div>

                  <motion.div animate={{ borderColor: formData.description ? "#10b981" : isRecording ? "#ef4444" : undefined }} transition={{ duration: 0.3 }}>
                    <Textarea
                      id="description"
                      placeholder={isRecording ? "🎤 Listening... Speak clearly to describe the emergency" : "Describe the emergency situation in detail..."}
                      value={formData.description}
                      onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                      className={`min-h-36 bg-input border-2 transition-all duration-200 resize-none focus:border-primary ${
                        formData.description ? "border-green-500/50 bg-green-50/50 dark:bg-green-900/10" : ""
                      }`}
                    />
                  </motion.div>

                  <div className="flex justify-between items-center text-xs text-muted-foreground">
                    <span>
                      {isRecording && (
                        <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-1 text-destructive">
                          <div className="w-2 h-2 bg-destructive rounded-full animate-pulse" />
                          Recording...
                        </motion.span>
                      )}
                    </span>
                    <span>{formData.description.length}/500 characters</span>
                  </div>
                </motion.div>

                {/* Location */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="address" className="text-foreground font-semibold">
                      Location *
                    </Label>
                    <motion.div
                      animate={{ scale: formData.address ? [1, 1.2, 1] : 1 }}
                      className={`w-2 h-2 rounded-full ${formData.address ? "bg-green-500" : "bg-muted-foreground"}`}
                    />
                  </div>

                  <div className="relative">
                    <motion.div animate={{ x: formData.address ? [0, 2, 0] : 0 }} transition={{ duration: 1, repeat: formData.address ? Infinity : 0 }} className="absolute left-3 top-3 z-10">
                      <MapPin className={`h-5 w-5 ${formData.address ? "text-green-500" : "text-muted-foreground"}`} />
                    </motion.div>
                    <Input
                      id="address"
                      placeholder="Enter address or landmark"
                      value={formData.address}
                      onChange={(e) => setFormData((p) => ({ ...p, address: e.target.value }))}
                      className={`pl-12 bg-input border-2 transition-all duration-200 h-12 focus:border-primary ${
                        formData.address ? "border-green-500/50 bg-green-50/50 dark:bg-green-900/10" : "hover:border-accent/50"
                      }`}
                    />
                  </div>

                  <motion.p initial={{ opacity: 0.7 }} animate={{ opacity: formData.address ? 1 : 0.7 }} className="text-sm text-muted-foreground flex items-center gap-2">
                    <Clock className="h-3 w-3" />
                    Be as specific as possible (street address, building name, landmarks, etc.)
                  </motion.p>
                </motion.div>

                {/* Media Upload */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }} className="space-y-3">
                  <Label htmlFor="media" className="text-foreground font-semibold">
                    Upload Photo (Optional)
                  </Label>

                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 cursor-pointer group ${
                      formData.media ? "border-green-500/50 bg-green-50/50 dark:bg-green-900/10" : "border-border hover:border-primary/50 hover:bg-accent/5"
                    }`}
                  >
                    <input id="media" type="file" accept="image/*" onChange={handleMediaUpload} className="hidden" />
                    <label htmlFor="media" className="cursor-pointer block">
                      <div className="flex flex-col items-center gap-4">
                        {formData.media ? (
                          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex flex-col items-center gap-3">
                            <motion.div
                              animate={{ rotate: [0, 5, -5, 0] }}
                              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                              className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full"
                            >
                              <CheckCircle className="h-8 w-8 text-green-500" />
                            </motion.div>
                            <div className="text-center">
                              <p className="text-sm font-semibold text-green-700 dark:text-green-400">{formData.media.name}</p>
                              <p className="text-xs text-muted-foreground mt-1">Click to change file</p>
                            </div>
                          </motion.div>
                        ) : (
                          <motion.div initial={{ opacity: 0.7 }} whileHover={{ opacity: 1, scale: 1.05 }} className="flex flex-col items-center gap-3">
                            <motion.div
                              animate={{ y: [0, -2, 0] }}
                              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                              className="p-3 bg-muted/50 rounded-full group-hover:bg-primary/10 transition-colors"
                            >
                              <Camera className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors" />
                            </motion.div>
                            <div className="text-center">
                              <p className="text-base font-semibold text-foreground group-hover:text-primary transition-colors">Upload Photo</p>
                              <p className="text-sm text-muted-foreground mt-1">Photos help responders understand the situation better</p>
                            </div>
                          </motion.div>
                        )}
                      </div>
                    </label>
                  </motion.div>
                </motion.div>

                {/* Map */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }} className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-foreground font-semibold flex items-center gap-2">
                      Select Location on Map
                      <motion.div animate={{ rotate: [0, 5, -5, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}>
                        <MapPin className="h-4 w-4 text-accent" />
                      </motion.div>
                    </Label>
                    <motion.p initial={{ opacity: 0.7 }} animate={{ opacity: 1 }} className="text-sm text-muted-foreground flex items-center gap-2">
                      <motion.span animate={{ x: [0, 2, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
                        👆
                      </motion.span>
                      Click on the map to pinpoint the exact location of the incident
                    </motion.p>
                  </div>

                  <motion.div whileHover={{ scale: 1.01 }} className="h-72 bg-muted/50 rounded-xl border-2 border-border overflow-hidden hover:border-accent/50 transition-all duration-300">
                    <LocationSelectorMap
                      onLocationSelect={handleLocationSelect}
                      position={selectedLocation ? [selectedLocation.lat, selectedLocation.lng] : null}
                    />
                  </motion.div>

                  {selectedLocation && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ type: "spring", stiffness: 200 }}
                      className="flex items-start gap-3 p-4 bg-gradient-to-r from-accent/10 to-primary/10 rounded-xl border border-accent/30 shadow-sm"
                    >
                      <motion.div
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        className="p-2 bg-accent/20 rounded-full mt-0.5"
                      >
                        <MapPin className="h-5 w-5 text-accent" />
                      </motion.div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground mb-1">Selected Location:</p>
                        <p className="text-sm text-muted-foreground font-medium truncate">{selectedLocation.address}</p>
                        <p className="text-xs text-muted-foreground mt-1 font-mono">
                          📍 Lat: {selectedLocation.lat.toFixed(6)}, Lng: {selectedLocation.lng.toFixed(6)}
                        </p>
                      </div>
                      <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 1, repeat: Infinity }} className="w-2 h-2 bg-accent rounded-full" />
                    </motion.div>
                  )}
                </motion.div>

                {/* Submit */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.0 }}
                  whileHover={{ scale: isSubmitting || isSuccess ? 1 : 1.02 }}
                  whileTap={{ scale: isSubmitting || isSuccess ? 1 : 0.98 }}
                >
                  <Button
                    type="submit"
                    disabled={isSubmitting || isSuccess}
                    className={`w-full h-14 text-lg font-semibold transition-all duration-300 relative overflow-hidden ${
                      isSuccess
                        ? "bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-500/25"
                        : isSubmitting
                        ? "bg-primary/80 text-primary-foreground animate-pulse"
                        : "bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white shadow-lg hover:shadow-xl hover:shadow-primary/25"
                    }`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 opacity-0 hover:opacity-100 transition-opacity duration-500" />

                    {isSubmitting ? (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3 relative z-10">
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
                        <span>Submitting Report...</span>
                      </motion.div>
                    ) : isSuccess ? (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200 }} className="flex items-center gap-3 relative z-10">
                        <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 0.6, repeat: 2 }} className="p-1 bg-white/20 rounded-full">
                          <CheckCircle className="h-6 w-6" />
                        </motion.div>
                        <span>Report Submitted!</span>
                      </motion.div>
                    ) : (
                      <motion.div initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="flex items-center gap-3 relative z-10">
                        <motion.div whileHover={{ scale: 1.1, rotate: 5 }} className="p-2 bg-white/10 rounded-full">
                          <Upload className="h-6 w-6" />
                        </motion.div>
                        <span>Submit Emergency Report</span>
                      </motion.div>
                    )}
                  </Button>
                </motion.div>

                {/* Emergency Notice */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1 }} className="p-6 bg-gradient-to-r from-destructive/10 to-destructive/5 border-2 border-destructive/20 rounded-xl relative overflow-hidden">
                  <div className="absolute inset-0 opacity-5">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-destructive/20 to-transparent animate-gradient" />
                  </div>

                  <div className="flex items-start gap-4 relative z-10">
                    <motion.div animate={{ rotate: [0, 5, -5, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} className="p-2 bg-destructive/20 rounded-full">
                      <AlertTriangle className="h-6 w-6 text-destructive" />
                    </motion.div>
                    <div className="flex-1">
                      <motion.p initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="text-base font-bold text-destructive mb-2">
                        ⚠️ For Life-Threatening Emergencies
                      </motion.p>
                      <motion.p initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="text-sm text-destructive/90 leading-relaxed">
                        <strong className="font-semibold">Call 911 immediately</strong> for any situation requiring immediate medical attention, fire emergencies, or criminal activity. This app is designed for community coordination and non-critical emergencies only.
                      </motion.p>
                    </div>
                  </div>
                </motion.div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </main>

      <Footer />
    </div>
  )
}
