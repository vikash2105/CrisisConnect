"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button.jsx"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.jsx"
import { Badge } from "@/components/ui/badge.jsx"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog.jsx"
import { MapPin, Clock, Heart, CheckCircle, Navigation, Loader2, Zap, TrendingUp } from "lucide-react"
import { Footer } from "@/components/footer.jsx"
import { useToast } from "@/hooks/use-toast.js"
import { formatDistanceToNow } from "date-fns"
import dynamic from "next/dynamic"
import { io } from "socket.io-client"
import { getProfile } from "@/lib/profileApi.js"

// Dynamically import Map component
const Map = dynamic(() => import("@/components/Map.jsx"), { 
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin" />
      <span className="ml-2">Loading Map...</span>
    </div>
  )
})

// Helper functions
const getSeverity = (category) => {
  switch (category) {
    case "Fire":
    case "Accident":
    case "Medical Emergency":
    case "Blood Donation":
      return "high"
    case "Power Outage":
    case "Flood":
    case "Food & Water Aid":
    case "Shelter Help":
    case "Elderly Support":
    case "Cleanup Drive":
    case "Community Support":
      return "medium"
    default: 
      return "low"
  }
}

const getSeverityColor = (severity) => {
  switch (severity) {
    case "high": return "bg-destructive text-destructive-foreground"
    case "medium": return "bg-primary text-primary-foreground"
    case "low": return "bg-secondary text-secondary-foreground"
    default: return "bg-muted text-muted-foreground"
  }
}

const getStatusColor = (status) => {
  switch (status) {
    case "Resolved":
      return "bg-green-100 text-green-800"
    case "In Progress":
      return "bg-yellow-100 text-yellow-800"
    case "Pending":
      return "bg-red-100 text-red-800"
    default:
      return "bg-muted text-muted-foreground"
  }
}

export default function HomePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [userName, setUserName] = useState("")
  const [userLocations, setUserLocations] = useState([])
  const [incidents, setIncidents] = useState([])
  const [incidentsLoading, setIncidentsLoading] = useState(true)
  const [incidentsError, setIncidentsError] = useState("")
  const [selectedIncident, setSelectedIncident] = useState(null)
  const [showVolunteerModal, setShowVolunteerModal] = useState(false)
  const [isVolunteering, setIsVolunteering] = useState(false)
  const [currentUserId, setCurrentUserId] = useState(null)
  const [mapCenter, setMapCenter] = useState([28.5355, 77.3910])

  useEffect(() => {
    const authStatus = localStorage.getItem("isAuthenticated") === "true"

    if (!authStatus) {
      router.push("/auth") // Redirect if not authenticated
    } else {
      setIsAuthenticated(true)

      // Fetch fresh profile data from API
      const loadProfile = async () => {
        try {
          const profileData = await getProfile()
          setUserName(profileData.fullname || profileData.name || "User")
          setUserLocations(profileData.serviceLocations || [])
          setCurrentUserId(profileData.id)
        } catch (error) {
          console.error("Error loading profile:", error)
          const errorMessage = error instanceof Error ? error.message : "Failed to load profile"

          if (String(errorMessage).toLowerCase().includes("sign in")) {
            toast({ title: "Session expired", description: "Please sign in again to continue.", variant: "destructive" })
            localStorage.removeItem("userData")
            setIsAuthenticated(false)
            router.push("/auth")
            return
          }

          // Fallback to localStorage if API fails for other reasons
          const userData = localStorage.getItem("userData")
          if (userData) {
            const parsedUserData = JSON.parse(userData)
            setUserName(parsedUserData.fullname || parsedUserData.name || "User")
            setUserLocations(parsedUserData.serviceLocations || [])
            setCurrentUserId(parsedUserData.id)
          } else {
            setUserName("User")
            setUserLocations([])
          }
        }
        setIsLoading(false)
      }

      loadProfile()
    }
  }, [router, toast])

  // Fetch nearby incidents
  useEffect(() => {
    if (!isAuthenticated) return

    const fetchIncidents = () => {
      const token = localStorage.getItem("token")
      if (!token) {
        setIncidentsError("Please log in to view nearby incidents.")
        setIncidentsLoading(false)
        return
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords
          setMapCenter([latitude, longitude])
          
          try {
            const response = await fetch(
              `${API_URL}/api/incidents/nearby?lat=${latitude}&lng=${longitude}`,
              { headers: { Authorization: `Bearer ${token}` } }
            )
            
            if (!response.ok) {
              const errorData = await response.json()
              throw new Error(errorData.message || "Failed to fetch incidents.")
            }
            
            const data = await response.json()
            setIncidents(data)
          } catch (err) {
            const message = (err && err.message) || "Failed to fetch incidents."
            if (String(message).toLowerCase().includes("token")) {
              localStorage.removeItem("token")
              localStorage.removeItem("isAuthenticated")
              localStorage.removeItem("userData")
              setIncidentsError("Please sign in again to view incidents.")
              router.push("/auth")
            } else {
              setIncidentsError(message)
            }
          } finally {
            setIncidentsLoading(false)
          }
        },
        () => {
          setIncidentsError("Unable to retrieve your location. Please enable location services.")
          setIncidentsLoading(false)
        }
      )
    }

    fetchIncidents()
  }, [isAuthenticated, router])

  // WebSocket connection for real-time updates
  useEffect(() => {
    if (!isAuthenticated) return

    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
    const socket = io(API_URL)

    socket.on("connect", () => {
      console.log("WebSocket connected:", socket.id)
    })

    socket.on("new-incident", (newIncident) => {
      console.log("New incident received via WebSocket:", newIncident)
      setIncidents((prevIncidents) => {
        // avoid duplicates
        const exists = prevIncidents.some((inc) => inc._id === newIncident._id)
        if (exists) return prevIncidents
        return [newIncident, ...prevIncidents]
      })

      toast({
        title: "New Emergency Reported!",
        description: `${newIncident.category} reported near ${newIncident.address}`,
        duration: 5000,
      })
    })

    socket.on("disconnect", () => {
      console.log("WebSocket disconnected")
    })

    // Cleanup on unmount
    return () => {
      socket.disconnect()
    }
  }, [isAuthenticated, toast])

  const handleVolunteerClick = (incident) => {
    setSelectedIncident(incident)
    setShowVolunteerModal(true)
  }

  const confirmVolunteer = async () => {
    if (!selectedIncident) return
    setIsVolunteering(true)
    const token = localStorage.getItem("token")
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
    
    try {
      if (!token) throw new Error("Authentication error. Please log in again.")
      
      const response = await fetch(
        `${API_URL}/api/incidents/${selectedIncident._id}/volunteer`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` }
        }
      )
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Could not volunteer for the incident.")
      }
      
      setIncidents((prev) =>
        prev.map((incident) =>
          incident._id === selectedIncident._id
            ? { ...incident, volunteers: [...incident.volunteers, currentUserId || ""] }
            : incident
        )
      )
      
      toast({
        title: "Thank you for volunteering!",
        description: `You've been assigned to help with the ${selectedIncident.category.toLowerCase()} incident.`,
      })
    } catch (err) {
      toast({ title: "Error", description: (err && err.message) || "Failed to volunteer.", variant: "destructive" })
    } finally {
      setIsVolunteering(false)
      setShowVolunteerModal(false)
      setSelectedIncident(null)
    }
  }

  // Simplified loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/10 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-6"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full mx-auto"
          />

          <div className="space-y-2">
            <p className="text-xl font-semibold text-foreground">Preparing your dashboard...</p>
            <p className="text-muted-foreground">Connecting to emergency services</p>
          </div>

          <div className="flex justify-center space-x-2">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                className="w-3 h-3 bg-primary rounded-full"
              />
            ))}
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/10">
      {/* Simplified Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ x: [0, 20, 0], y: [0, -10, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-20 left-10 w-32 h-32 bg-primary/5 rounded-full"
        />
        <motion.div
          animate={{ x: [0, -15, 0], y: [0, 15, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute top-40 right-20 w-24 h-24 bg-secondary/5 rounded-full"
        />
      </div>

      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10"
      >
        <div className="bg-gradient-to-r from-primary/10 via-secondary/5 to-accent/10 border-b border-border/50">
          <div className="container mx-auto px-4 py-12">
            <div className="text-center max-w-4xl mx-auto">
              {/* Platform Badge */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="mb-6"
              >
                <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-full border border-primary/20 backdrop-blur-sm">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                    className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full"
                  />
                  <span className="text-sm font-medium text-foreground">Live Emergency Response Platform</span>
                </div>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-5xl md:text-6xl font-bold text-foreground mb-6 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent leading-tight"
              >
                CrisisConnect
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-xl text-muted-foreground mb-8 leading-relaxed"
              >
                Connect. Respond. Save.
              </motion.p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main */}
      <main className="container mx-auto px-4 py-8 relative z-10">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <Card className="mb-8 bg-gradient-to-br from-card via-card to-muted/20 border-border hover-lift relative overflow-hidden">
            <CardHeader className="relative z-10">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="flex items-center gap-4"
              >
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="p-3 bg-primary/10 rounded-full"
                >
                  <Zap className="h-8 w-8 text-primary" />
                </motion.div>
                <div>
                  <CardTitle className="text-3xl font-bold text-foreground bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    Welcome back, {userName}!
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2 text-muted-foreground text-base mt-1">
                    <MapPin className="h-5 w-5 text-accent" />
                    Your saved locations:{" "}
                    <span className="font-medium text-foreground">
                      {userLocations.length > 0
                        ? userLocations.map((loc) => `${loc.city}, ${loc.state}`).join("; ")
                        : "No locations saved"}
                    </span>
                  </CardDescription>
                </div>
              </motion.div>

              {/* Quick Stats */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-border/50"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                    <TrendingUp className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Active Incidents</p>
                    <p className="text-xl font-bold text-foreground">{incidents.filter(i => i.status !== "Resolved").length}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-full">
                    <Heart className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Your Contributions</p>
                    <p className="text-xl font-bold text-foreground">
                      {incidents.filter(i => i.volunteers.includes(currentUserId || "")).length}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-full">
                    <Zap className="h-5 w-5 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Response Rate</p>
                    <p className="text-xl font-bold text-foreground">94%</p>
                  </div>
                </div>
              </motion.div>
            </CardHeader>
          </Card>
        </motion.div>

        {/* Real-time Incidents with Map */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <motion.div 
            initial={{ opacity: 0, x: -20 }} 
            animate={{ opacity: 1, x: 0 }} 
            transition={{ duration: 0.5, delay: 0.2 }} 
            className="lg:col-span-2"
          >
            <Card className="bg-card border-border h-[600px]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Navigation className="h-5 w-5 text-accent" /> 
                  Live Incident Map
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Real-time incidents near your location
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[500px] p-0">
                {incidentsLoading ? (
                  <div className="h-full flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <span className="ml-2">Loading incidents...</span>
                  </div>
                ) : incidentsError ? (
                  <div className="h-full flex items-center justify-center text-destructive">
                    <p>{incidentsError}</p>
                  </div>
                ) : (
                  <Map incidents={incidents} center={mapCenter} />
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }} 
            animate={{ opacity: 1, x: 0 }} 
            transition={{ duration: 0.5, delay: 0.3 }} 
            className="space-y-4"
          >
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Active Incidents</CardTitle>
                <CardDescription className="text-muted-foreground">
                  {incidents.filter((i) => i.status !== "Resolved").length} incidents need assistance
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 max-h-[500px] overflow-y-auto">
                {incidentsLoading ? (
                  <div className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  </div>
                ) : incidentsError ? (
                  <p className="text-sm text-destructive text-center py-8">{incidentsError}</p>
                ) : incidents.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No incidents in your area
                  </p>
                ) : (
                  incidents.map((incident, index) => {
                    const severity = getSeverity(incident.category)
                    const isUserVolunteering = currentUserId ? incident.volunteers.includes(currentUserId) : false
                    
                    return (
                      <motion.div 
                        key={incident._id} 
                        initial={{ opacity: 0, y: 20 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        transition={{ duration: 0.3, delay: index * 0.05 }} 
                        className="p-4 rounded-lg border border-border bg-background hover:bg-muted/50 transition-colors"
                      >
                        <div className="space-y-3">
                          {/* Show reporter name when available */}
                          {incident.reportedBy?.fullname && (
                            <div className="text-xs text-muted-foreground flex items-center gap-2">
                              <span className="inline-block h-2 w-2 rounded-full bg-accent" />
                              <span className="font-semibold text-foreground">{incident.reportedBy.fullname}</span>
                            </div>
                          )}
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <Badge className={getSeverityColor(severity)}>{incident.category}</Badge>
                              <Badge variant="outline" className={getStatusColor(incident.status)}>
                                {incident.status}
                              </Badge>
                            </div>
                          </div>
                          {incident.imageUrl && (
                            <div className="mt-3">
                              <img 
                                src={incident.imageUrl} 
                                alt={`Image for ${incident.category} incident`}
                                className="rounded-lg w-full h-40 object-cover border border-border"
                                onError={(e) => (e.currentTarget.style.display = "none")}
                              />
                            </div>
                          )}
                          <p className="text-sm font-medium text-foreground pt-1">{incident.description}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" /> {incident.address}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" /> 
                              {formatDistanceToNow(new Date(incident.createdAt), { addSuffix: true })}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Heart className="h-3 w-3" />
                              <span>
                                {incident.volunteers.length} {incident.volunteers.length === 1 ? "volunteer" : "volunteers"}
                              </span>
                            </div>
                            {incident.status !== "Resolved" && (
                              <Button 
                                size="sm" 
                                variant={isUserVolunteering ? "secondary" : "default"}
                                disabled={isUserVolunteering} 
                                onClick={() => handleVolunteerClick(incident)} 
                                className="h-8 text-xs hover:scale-105 transition-transform"
                              >
                                {isUserVolunteering ? (
                                  <><CheckCircle className="mr-1 h-3 w-3" /> Volunteering</>
                                ) : (
                                  <><Heart className="mr-1 h-3 w-3" />I Will Help</>
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )
                  })
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>

      {/* Volunteer Confirmation Modal */}
      <AnimatePresence>
        {showVolunteerModal && selectedIncident && (
          <Dialog open={showVolunteerModal} onOpenChange={setShowVolunteerModal}>
            <DialogContent className="sm:max-w-lg z-[1000]">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="relative"
              >
                <DialogHeader>
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3 mb-2"
                  >
                    <motion.div
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      className="p-2 bg-primary/10 rounded-full"
                    >
                      <Heart className="h-5 w-5 text-primary" />
                    </motion.div>
                    <DialogTitle className="text-xl font-bold text-foreground">
                      Volunteer Confirmation
                    </DialogTitle>
                  </motion.div>
                  <DialogDescription className="text-muted-foreground">
                    Your help can make a real difference. Ready to assist?
                  </DialogDescription>
                </DialogHeader>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="py-4"
                >
                  <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={getSeverityColor(getSeverity(selectedIncident.category))}>
                        {selectedIncident.category}
                      </Badge>
                      <Badge variant="outline" className={getStatusColor(selectedIncident.status)}>
                        {selectedIncident.status}
                      </Badge>
                    </div>

                    <p className="text-sm font-medium text-foreground leading-relaxed">
                      {selectedIncident.description}
                    </p>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4 text-accent" />
                      <span className="font-medium">{selectedIncident.address}</span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Current Volunteers</span>
                      <span className="font-semibold text-primary">
                        {selectedIncident.volunteers.length}
                      </span>
                    </div>
                  </div>
                </motion.div>

                <DialogFooter className="gap-3">
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      variant="outline"
                      onClick={() => setShowVolunteerModal(false)}
                      disabled={isVolunteering}
                    >
                      Cancel
                    </Button>
                  </motion.div>

                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      onClick={confirmVolunteer}
                      disabled={isVolunteering}
                      className="bg-primary hover:bg-primary/90 text-white"
                    >
                      {isVolunteering ? (
                        <motion.div className="flex items-center gap-2">
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                          />
                          <span>Joining...</span>
                        </motion.div>
                      ) : (
                        <>
                          <Heart className="mr-2 h-4 w-4" />
                          Yes, I'll Help
                        </>
                      )}
                    </Button>
                  </motion.div>
                </DialogFooter>
              </motion.div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>

      {/* Notification Center (FAB) */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.8 }}
        className="fixed bottom-6 right-6 z-50"
      >
        <div className="relative">
          <Button
            size="lg"
            className="h-12 w-12 rounded-full bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all duration-300 relative"
          >
            <Zap className="h-5 w-5 text-white" />

            {incidents.filter(i => i.status !== "Resolved").length > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 w-5 h-5 bg-destructive rounded-full flex items-center justify-center"
              >
                <span className="text-xs font-bold text-white">
                  {incidents.filter(i => i.status !== "Resolved").length}
                </span>
              </motion.div>
            )}
          </Button>

          {/* Tooltip */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileHover={{ opacity: 1, scale: 1 }}
            className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-popover border border-border rounded-lg shadow-lg text-sm font-medium text-popover-foreground whitespace-nowrap"
          >
            {incidents.filter(i => i.status !== "Resolved").length} active emergencies
            <div className="absolute top-full right-3 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-popover" />
          </motion.div>
        </div>
      </motion.div>

      <Footer />
    </div>
  )
}
