"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button.jsx"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.jsx"
import { Input } from "@/components/ui/input.jsx"
import { Label } from "@/components/ui/label.jsx"
import { Textarea } from "@/components/ui/textarea.jsx"
import { Switch } from "@/components/ui/switch.jsx"
import { Separator } from "@/components/ui/separator.jsx"
import { Badge } from "@/components/ui/badge.jsx"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar.jsx"
import { User, Bell, Shield, Award, Calendar, Edit, Save, X, Loader2, MapPin, Star, TrendingUp, LogOut } from "lucide-react"
import { useToast } from "@/hooks/use-toast.js"

// Animation variants (no TS types)
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5
    }
  }
}

const scaleInVariants = {
  hidden: { scale: 0.8, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      duration: 0.4
    }
  }
}

export default function ProfilePage() {
  const { toast } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [stats, setStats] = useState({
    totalContributions: 0,
    problemsReported: 0,
    volunteerResponses: 0
  })
  
  const [profile, setProfile] = useState({
    name: "Alex Johnson",
    email: "alex.johnson@email.com",
    phone: "+1 (555) 123-4567",
    location: "Downtown District, City Center",
    bio: "Community volunteer passionate about helping neighbors during emergencies. Available for disaster response and first aid assistance.",
    joinDate: "March 2024",
    skills: "",
    serviceLocations: [],
  })

  const [notifications, setNotifications] = useState({
    emergencyAlerts: true,
    volunteerRequests: true,
    statusUpdates: true,
    weeklyDigest: false,
  })

  useEffect(() => {
    // Fetch profile from backend
    async function fetchProfile() {
      setIsLoading(true)
      try {
        const { getProfile } = await import('@/lib/profileApi')
        const data = await getProfile()
        
        setProfile({
          name: data.fullname,
          email: data.email,
          phone: data.phone,
          bio: data.bio || '',
          skills: data.skills || '',
          serviceLocations: data.serviceLocations || [],
          location: data.serviceLocations && data.serviceLocations.length > 0
            ? `${data.serviceLocations[0].city}, ${data.serviceLocations[0].district}, ${data.serviceLocations[0].state}`
            : 'Not set',
          joinDate: new Date(data.joinDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
        })
        
        if (data.notifications) {
          setNotifications(data.notifications)
        }
        
        if (data.stats) {
          setStats({
            totalContributions: data.stats.totalContributions || 0,
            problemsReported: data.stats.problemsReported || 0,
            volunteerResponses: data.stats.volunteerResponses || 0
          })
        }
      } catch (error) {
        console.error('Error fetching profile:', error)
        toast({
          title: "Error",
          description: "Failed to load profile. Please try again.",
          variant: "destructive"
        })
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchProfile()
  }, [toast])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const { updateProfile } = await import('@/lib/profileApi')
      await updateProfile({
        fullname: profile.name,
        phone: profile.phone,
        bio: profile.bio,
        skills: profile.skills,
        notifications: notifications
      })

      setIsEditing(false)
      toast({
        title: "✓ Profile Updated",
        description: "Your profile information has been saved successfully.",
      })
    } catch (error) {
      console.error('Error saving profile:', error)
      toast({
        title: "Error",
        description: (error && error.message) || "Failed to save profile. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = async () => {
    // Reload profile from backend to discard changes
    try {
      const { getProfile } = await import('@/lib/profileApi')
      const data = await getProfile()
      
      setProfile({
        name: data.fullname,
        email: data.email,
        phone: data.phone,
        bio: data.bio || '',
        skills: data.skills || '',
        serviceLocations: data.serviceLocations || [],
        location: data.serviceLocations && data.serviceLocations.length > 0
          ? `${data.serviceLocations[0].city}, ${data.serviceLocations[0].district}, ${data.serviceLocations[0].state}`
          : 'Not set',
        joinDate: new Date(data.joinDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      })
      
      if (data.notifications) {
        setNotifications(data.notifications)
      }
    } catch (error) {
      console.error('Error reloading profile:', error)
    }
    setIsEditing(false)
  }

  // Logout from Profile page
  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated")
    localStorage.removeItem("userData")
    window.location.href = "/auth"
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading your profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* Header */}
        <motion.div 
          variants={itemVariants}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold text-foreground bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              My Profile
            </h1>
            <p className="text-muted-foreground mt-1">Manage your account and preferences</p>
          </div>
          <div className="flex items-center gap-2">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button 
                onClick={isEditing ? handleSave : () => setIsEditing(true)} 
                className="flex items-center gap-2 shadow-lg"
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : isEditing ? (
                  <>
                    <Save className="h-4 w-4" />
                    Save Changes
                  </>
                ) : (
                  <>
                    <Edit className="h-4 w-4" />
                    Edit Profile
                  </>
                )}
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button 
                variant="outline"
                onClick={handleLogout}
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </motion.div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Info */}
          <div className="lg:col-span-2 space-y-6">
            <motion.div variants={itemVariants}>
              <Card className="border-2 hover:border-primary/50 transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <motion.div
                      animate={{ rotate: isEditing ? 360 : 0 }}
                      transition={{ duration: 0.5 }}
                    >
                      <User className="h-5 w-5 text-primary" />
                    </motion.div>
                    Personal Information
                  </CardTitle>
                  <CardDescription>Your basic profile information visible to other community members</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <motion.div 
                    className="flex items-center gap-4 mb-6 p-4 rounded-lg bg-gradient-to-r from-primary/5 to-secondary/5"
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                  >
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Avatar className="h-20 w-20 ring-4 ring-primary/20">
                        <AvatarImage src="/diverse-profile-avatars.png" />
                        <AvatarFallback className="text-lg bg-gradient-to-br from-primary to-secondary text-white">
                          {profile.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </motion.div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                        {profile.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="gap-1">
                          <Star className="h-3 w-3 fill-current" />
                          Community Volunteer
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Member since {profile.joinDate}</span>
                      </div>
                    </div>
                  </motion.div>

                <motion.div 
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <motion.div whileTap={{ scale: isEditing ? 0.98 : 1 }}>
                    <Label htmlFor="name" className="text-foreground font-medium">Full Name</Label>
                    <Input
                      id="name"
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      disabled={!isEditing}
                      className={`mt-1 transition-all duration-200 ${isEditing ? 'ring-2 ring-primary/20 focus:ring-primary/40' : ''}`}
                    />
                  </motion.div>
                  <motion.div whileTap={{ scale: isEditing ? 0.98 : 1 }}>
                    <Label htmlFor="email" className="text-foreground font-medium">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                      disabled
                      className="mt-1 bg-muted/50"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
                  </motion.div>
                  <motion.div whileTap={{ scale: isEditing ? 0.98 : 1 }}>
                    <Label htmlFor="phone" className="text-foreground font-medium">Phone Number</Label>
                    <Input
                      id="phone"
                      value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      disabled={!isEditing}
                      className={`mt-1 transition-all duration-200 ${isEditing ? 'ring-2 ring-primary/20 focus:ring-primary/40' : ''}`}
                    />
                  </motion.div>
                  <motion.div whileTap={{ scale: 1 }}>
                    <Label htmlFor="location" className="text-foreground font-medium flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      Primary Location
                    </Label>
                    <Input
                      id="location"
                      value={profile.location}
                      disabled
                      className="mt-1 bg-muted/50"
                    />
                    <p className="text-xs text-muted-foreground mt-1">From service locations</p>
                  </motion.div>
                </motion.div>

                <motion.div whileTap={{ scale: isEditing ? 0.98 : 1 }}>
                  <Label htmlFor="skills" className="text-foreground font-medium">Skills & Interests</Label>
                  <Textarea
                    id="skills"
                    value={profile.skills}
                    onChange={(e) => setProfile({ ...profile, skills: e.target.value })}
                    disabled={!isEditing}
                    className={`mt-1 transition-all duration-200 ${isEditing ? 'ring-2 ring-primary/20 focus:ring-primary/40' : ''}`}
                    rows={2}
                    placeholder="e.g., First Aid, Driving, Cooking, Communication, Logistics..."
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {profile.skills.length}/200 characters
                  </p>
                </motion.div>

                <motion.div whileTap={{ scale: isEditing ? 0.98 : 1 }}>
                  <Label htmlFor="bio" className="text-foreground font-medium">Bio</Label>
                  <Textarea
                    id="bio"
                    value={profile.bio}
                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                    disabled={!isEditing}
                    className={`mt-1 transition-all duration-200 ${isEditing ? 'ring-2 ring-primary/20 focus:ring-primary/40' : ''}`}
                    rows={3}
                    placeholder="Tell the community about yourself..."
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {profile.bio.length}/300 characters
                  </p>
                </motion.div>

                {profile.serviceLocations && profile.serviceLocations.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    transition={{ duration: 0.3 }}
                  >
                    <Label className="text-foreground font-medium">Service Locations</Label>
                    <div className="mt-2 space-y-2">
                      {profile.serviceLocations.map((location, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          whileHover={{ scale: 1.02, x: 5 }}
                          className="flex items-center gap-2 p-3 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-lg border border-primary/10"
                        >
                          <MapPin className="h-4 w-4 text-primary" />
                          <span className="text-sm font-medium">
                            {location.district}, {location.city}, {location.state}
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}

                <AnimatePresence>
                  {isEditing && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex gap-2 pt-4"
                    >
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button 
                          onClick={handleCancel} 
                          variant="outline" 
                          className="flex items-center gap-2"
                        >
                          <X className="h-4 w-4" />
                          Cancel
                        </Button>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
            </motion.div>

            {/* Notification Settings */}
            <motion.div variants={itemVariants}>
            <Card className="border-2 hover:border-primary/50 transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <motion.div
                    animate={{ rotate: [0, 15, -15, 0] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 5 }}
                  >
                    <Bell className="h-5 w-5 text-primary" />
                  </motion.div>
                  Notification Preferences
                </CardTitle>
                <CardDescription>Choose what notifications you want to receive</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <motion.div 
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors"
                  whileHover={{ scale: 1.01 }}
                >
                  <div>
                    <Label htmlFor="emergency-alerts" className="cursor-pointer font-medium">Emergency Alerts</Label>
                    <p className="text-sm text-muted-foreground">Critical emergency notifications in your area</p>
                  </div>
                  <Switch
                    id="emergency-alerts"
                    checked={notifications.emergencyAlerts}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, emergencyAlerts: checked })}
                  />
                </motion.div>
                <Separator />
                <motion.div 
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors"
                  whileHover={{ scale: 1.01 }}
                >
                  <div>
                    <Label htmlFor="volunteer-requests" className="cursor-pointer font-medium">Volunteer Requests</Label>
                    <p className="text-sm text-muted-foreground">When help is needed for incidents near you</p>
                  </div>
                  <Switch
                    id="volunteer-requests"
                    checked={notifications.volunteerRequests}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, volunteerRequests: checked })}
                  />
                </motion.div>
                <Separator />
                <motion.div 
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors"
                  whileHover={{ scale: 1.01 }}
                >
                  <div>
                    <Label htmlFor="status-updates" className="cursor-pointer font-medium">Status Updates</Label>
                    <p className="text-sm text-muted-foreground">Updates on incidents you've reported or helped with</p>
                  </div>
                  <Switch
                    id="status-updates"
                    checked={notifications.statusUpdates}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, statusUpdates: checked })}
                  />
                </motion.div>
                <Separator />
                <motion.div 
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors"
                  whileHover={{ scale: 1.01 }}
                >
                  <div>
                    <Label htmlFor="weekly-digest" className="cursor-pointer font-medium">Weekly Digest</Label>
                    <p className="text-sm text-muted-foreground">
                      Summary of community activity and your contributions
                    </p>
                  </div>
                  <Switch
                    id="weekly-digest"
                    checked={notifications.weeklyDigest}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, weeklyDigest: checked })}
                  />
                </motion.div>
              </CardContent>
            </Card>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Community Stats */}
            <motion.div variants={scaleInVariants}>
            <Card className="border-2 hover:border-primary/50 transition-all duration-300 overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-transparent rounded-full -mr-16 -mt-16" />
              <CardHeader>
                <CardTitle className="flex items-center gap-2 relative">
                  <motion.div
                    animate={{ 
                      scale: [1, 1.2, 1],
                      rotate: [0, 10, -10, 0]
                    }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                  >
                    <Award className="h-5 w-5 text-primary" />
                  </motion.div>
                  Community Impact
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 relative">
                <motion.div 
                  className="text-center p-6 rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.2 }}
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="text-5xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent"
                  >
                    {stats.totalContributions}
                  </motion.div>
                  <p className="text-sm text-muted-foreground mt-2 font-medium">Total Contributions</p>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className="h-1 bg-gradient-to-r from-primary to-secondary rounded-full mt-3"
                  />
                </motion.div>
                <Separator />
                <div className="space-y-3">
                  <motion.div 
                    className="flex justify-between items-center p-2 rounded-lg hover:bg-primary/5 transition-colors"
                    whileHover={{ x: 5 }}
                  >
                    <span className="text-sm font-medium">Problems Reported</span>
                    <Badge variant="secondary" className="gap-1">
                      <TrendingUp className="h-3 w-3" />
                      {stats.problemsReported}
                    </Badge>
                  </motion.div>
                  <motion.div 
                    className="flex justify-between items-center p-2 rounded-lg hover:bg-secondary/5 transition-colors"
                    whileHover={{ x: 5 }}
                  >
                    <span className="text-sm font-medium">Volunteer Responses</span>
                    <Badge variant="secondary" className="gap-1">
                      <TrendingUp className="h-3 w-3" />
                      {stats.volunteerResponses}
                    </Badge>
                  </motion.div>
                  <motion.div 
                    className="flex justify-between items-center p-2 rounded-lg hover:bg-green-50 transition-colors"
                    whileHover={{ x: 5 }}
                  >
                    <span className="text-sm font-medium">Community Rating</span>
                    <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white gap-1">
                      <Star className="h-3 w-3 fill-current" />
                      4.9
                    </Badge>
                  </motion.div>
                </div>
              </CardContent>
            </Card>
            </motion.div>

            {/* Achievements */}
            <motion.div variants={scaleInVariants}>
            <Card className="border-2 hover:border-primary/50 transition-all duration-300 overflow-hidden">
              <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-secondary/10 to-transparent rounded-full -ml-16 -mt-16" />
              <CardHeader>
                <CardTitle className="flex items-center gap-2 relative">
                  <motion.div
                    animate={{ 
                      scale: [1, 1.1, 1],
                    }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 4 }}
                  >
                    <Shield className="h-5 w-5 text-primary" />
                  </motion.div>
                  Achievements
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 relative">
                <motion.div
                  whileHover={{ scale: 1.05, x: 5 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-amber-50 to-transparent hover:from-amber-100 cursor-pointer"
                >
                  <motion.div 
                    className="w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center text-2xl shadow-lg"
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.5 }}
                  >
                    🏆
                  </motion.div>
                  <div>
                    <p className="font-semibold text-sm">First Responder</p>
                    <p className="text-xs text-muted-foreground">Helped in 10+ emergencies</p>
                  </div>
                </motion.div>
                
                <motion.div
                  whileHover={{ scale: 1.05, x: 5 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-blue-50 to-transparent hover:from-blue-100 cursor-pointer"
                >
                  <motion.div 
                    className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-2xl shadow-lg"
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.5 }}
                  >
                    🤝
                  </motion.div>
                  <div>
                    <p className="font-semibold text-sm">Community Helper</p>
                    <p className="text-xs text-muted-foreground">Active for 6+ months</p>
                  </div>
                </motion.div>
                
                <motion.div
                  whileHover={{ scale: 1.05, x: 5 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-green-50 to-transparent hover:from-green-100 cursor-pointer"
                >
                  <motion.div 
                    className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-2xl shadow-lg"
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.5 }}
                  >
                    📍
                  </motion.div>
                  <div>
                    <p className="font-semibold text-sm">Local Guardian</p>
                    <p className="text-xs text-muted-foreground">Covers downtown area</p>
                  </div>
                </motion.div>
              </CardContent>
            </Card>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
