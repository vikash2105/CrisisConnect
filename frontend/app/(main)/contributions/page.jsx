"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button.jsx"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.jsx"
import { Badge } from "@/components/ui/badge.jsx"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs.jsx"
import { Progress } from "@/components/ui/progress.jsx"
import { Footer } from "@/components/footer.jsx"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import {
  ArrowLeft,
  FileText,
  Heart,
  CheckCircle,
  Clock,
  AlertTriangle,
  MapPin,
  Calendar,
  TrendingUp,
  Award,
  Users,
  Target,
  Star,
  Trophy,
  Zap,
  Shield,
  Loader2,
  Trash2
} from "lucide-react"
import Link from "next/link"
import {
  getReportedIncidents,
  getVolunteeredIncidents,
  getContributionStats,
  deleteIncident,
  unvolunteerFromIncident
} from "@/lib/contributionApi.js"
import { WelcomeCardSkeleton, MapSkeleton } from "@/components/ui/skeleton.jsx"
import { useToast } from "@/hooks/use-toast.js"

const getStatusColor = (status) => {
  switch (status) {
    case "Resolved":
    case "Completed":
      return "bg-green-100 text-green-800"
    case "In Progress":
      return "bg-yellow-100 text-yellow-800"
    case "Pending":
      return "bg-red-100 text-red-800"
    default:
      return "bg-muted text-muted-foreground"
  }
}

const getStatusIcon = (status) => {
  switch (status) {
    case "Resolved":
    case "Completed":
      return <CheckCircle className="h-4 w-4 text-green-600" />
    case "In Progress":
      return <Clock className="h-4 w-4 text-yellow-600" />
    case "Pending":
      return <AlertTriangle className="h-4 w-4 text-red-600" />
    default:
      return <Clock className="h-4 w-4 text-muted-foreground" />
  }
}

const getPriorityColor = (priority) => {
  switch (priority) {
    case "high":
      return "bg-destructive text-destructive-foreground"
    case "medium":
      return "bg-primary text-primary-foreground"
    case "low":
      return "bg-secondary text-secondary-foreground"
    default:
      return "bg-muted text-muted-foreground"
  }
}

export default function ContributionsPage() {
  const [activeTab, setActiveTab] = useState("overview")
  const [reportedIncidents, setReportedIncidents] = useState([])
  const [volunteeredIncidents, setVolunteeredIncidents] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [deletingIncidentId, setDeletingIncidentId] = useState(null)
  const [cancellingIncidentId, setCancellingIncidentId] = useState(null)
  const { toast } = useToast()

  const handleDeleteIncident = async (incidentId) => {
    if (!confirm('Are you sure you want to delete this incident? This action cannot be undone.')) {
      return
    }

    setDeletingIncidentId(incidentId)
    try {
      await deleteIncident(incidentId)

      // Remove the deleted incident from the local state
      setReportedIncidents(prev => prev.filter(incident => incident.id !== incidentId))

      // Refresh stats to reflect the deletion
      const updatedStats = await getContributionStats()
      setStats(updatedStats)

      toast({
        title: "Incident Deleted",
        description: "The incident has been successfully deleted.",
      })
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: (error && error.message) || "Failed to delete the incident.",
        variant: "destructive",
      })
    } finally {
      setDeletingIncidentId(null)
    }
  }

  const handleCancelVolunteer = async (incidentId) => {
    setCancellingIncidentId(incidentId)
    try {
      await unvolunteerFromIncident(incidentId)

      setVolunteeredIncidents(prev => prev.filter(incident => incident.id !== incidentId))

      const updatedStats = await getContributionStats()
      setStats(updatedStats)

      toast({
        title: "Commitment cancelled",
        description: "You are no longer volunteering for this incident.",
      })
    } catch (error) {
      toast({
        title: "Cancel failed",
        description: (error && error.message) || "Unable to cancel your commitment.",
        variant: "destructive",
      })
    } finally {
      setCancellingIncidentId(null)
    }
  }

  useEffect(() => {
    async function fetchData() {
      try {
        const [reported, volunteered, statistics] = await Promise.all([
          getReportedIncidents(),
          getVolunteeredIncidents(),
          getContributionStats()
        ])
        
        setReportedIncidents(reported)
        setVolunteeredIncidents(volunteered)
        setStats(statistics)
      } catch (error) {
        console.error('Error fetching contribution data:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [])

  // Calculate from real stats
  const totalReports = stats?.totalReports || 0
  const totalVolunteerHours = stats?.totalVolunteerHours || 0
  const resolvedReports = stats?.resolvedReports || 0
  const completedVolunteerWork = stats?.completedVolunteerWork || 0
  const monthlyContributions = stats?.monthlyContributions || []
  const contributionTypes = stats?.contributionTypes || []

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/10 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-8"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full mx-auto"
          />

          <div className="space-y-3">
            <p className="text-xl font-semibold text-foreground">Loading your contributions...</p>
            <p className="text-muted-foreground">Fetching your impact data</p>
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

          {/* Loading skeleton preview */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="max-w-4xl mx-auto"
          >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="p-6 bg-card/50 backdrop-blur-sm rounded-xl border border-border/50">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-primary/20 rounded-full animate-pulse" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 bg-muted/50 rounded animate-pulse" />
                    <div className="h-8 bg-muted/50 rounded animate-pulse" />
                    <div className="h-3 bg-muted/30 rounded animate-pulse w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/10">
      {/* Animated Background Elements */}
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
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-6"
        >
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link href="/">
              <Button variant="ghost" className="text-muted-foreground hover:text-foreground hover:bg-accent/10 transition-all duration-200 focus-ring">
                <motion.div
                  whileHover={{ x: -2 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                </motion.div>
                Back to Dashboard
              </Button>
            </Link>
          </motion.div>
        </motion.div>

        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12 relative"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-secondary/5 to-accent/5 rounded-3xl opacity-50 animate-gradient" />

          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="relative z-10"
          >
            <div className="flex items-center justify-center mb-6">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="p-4 rounded-full bg-gradient-to-br from-secondary/20 to-primary/20 shadow-lg"
              >
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Award className="h-12 w-12 text-secondary" />
                </motion.div>
              </motion.div>
            </div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-4xl md:text-5xl font-bold text-foreground mb-4 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent leading-tight"
            >
              My Contributions
            </motion.h1>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="max-w-3xl mx-auto"
            >
              <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                Track your impact in the community through emergency reports and volunteer work.
                <span className="block mt-2 font-medium text-accent">
                  Every contribution makes a difference in building safer communities.
                </span>
              </p>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Stats Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12"
        >
          {[
            {
              title: "Total Reports",
              value: totalReports,
              icon: FileText,
              color: "text-primary",
              bgColor: "bg-primary/10",
              description: "Emergency reports submitted"
            },
            {
              title: "Volunteer Hours",
              value: totalVolunteerHours,
              icon: Heart,
              color: "text-secondary",
              bgColor: "bg-secondary/10",
              description: "Time contributed to community"
            },
            {
              title: "Resolved Reports",
              value: resolvedReports,
              icon: CheckCircle,
              color: "text-green-500",
              bgColor: "bg-green-100 dark:bg-green-900/20",
              description: "Successfully resolved incidents"
            },
            {
              title: "Community Impact",
              value: "High",
              icon: TrendingUp,
              color: "text-accent",
              bgColor: "bg-accent/10",
              description: "Overall contribution level"
            }
          ].map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 + index * 0.1 }}
              whileHover={{ scale: 1.05, y: -5 }}
              className="group"
            >
              <Card className="bg-gradient-to-br from-card via-card to-muted/20 border-border hover-lift relative overflow-hidden h-full">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                <CardContent className="p-6 relative z-10 h-full flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-4">
                    <motion.div
                      animate={{ rotate: [0, 5, -5, 0] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: index * 0.5 }}
                      className={`p-3 ${stat.bgColor} rounded-full`}
                    >
                      <stat.icon className={`h-6 w-6 ${stat.color}`} />
                    </motion.div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                    <motion.p
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                      className="text-3xl font-bold text-foreground"
                    >
                      {stat.value}
                    </motion.p>
                    <p className="text-xs text-muted-foreground">{stat.description}</p>
                  </div>

                  {(stat.title === "Resolved Reports" || stat.title === "Volunteer Hours") && (
                    <motion.div
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                      className="mt-4"
                    >
                      <div className="w-full bg-muted/30 rounded-full h-2 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${stat.title === "Resolved Reports" ? (totalReports === 0 ? 0 : (resolvedReports / totalReports) * 100) : (totalVolunteerHours / 20) * 100}%` }}
                          transition={{ duration: 1, delay: 0.6 + index * 0.1 }}
                          className={`h-full rounded-full ${stat.title === "Resolved Reports" ? 'bg-green-500' : 'bg-secondary'}`}
                        />
                      </div>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <TabsList className="grid w-full grid-cols-3 bg-muted/50 p-1 rounded-xl border border-border/50 h-auto">
                {[
                  { value: "overview", label: "Overview", icon: Target },
                  { value: "reported", label: "Problems Reported", icon: FileText },
                  { value: "volunteered", label: "Volunteer Work", icon: Heart }
                ].map((tab) => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className={`px-4 py-3 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 ${
                      activeTab === tab.value
                        ? 'bg-background shadow-md text-foreground border border-primary/20'
                        : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                    }`}
                  >
                    <motion.div
                      animate={{ scale: activeTab === tab.value ? 1.05 : 1 }}
                      className="flex items-center gap-2"
                    >
                      <tab.icon className="h-4 w-4" />
                      <span className="hidden sm:inline text-sm font-medium">{tab.label}</span>
                      <span className="sm:hidden text-xs">{tab.label.split(' ')[0]}</span>
                    </motion.div>
                  </TabsTrigger>
                ))}
              </TabsList>
            </motion.div>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-8"
              >
                {/* Monthly Contributions Chart */}
                <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.3 }}>
                  <Card className="bg-gradient-to-br from-card via-card to-muted/20 border-border hover-lift relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-secondary/5 opacity-50" />
                    <CardHeader className="relative z-10">
                      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3">
                        <motion.div
                          animate={{ rotate: [0, 5, -5, 0] }}
                          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                          className="p-2 bg-primary/10 rounded-full"
                        >
                          <TrendingUp className="h-6 w-6 text-primary" />
                        </motion.div>
                        <CardTitle className="text-foreground">Monthly Activity</CardTitle>
                      </motion.div>
                      <CardDescription className="text-muted-foreground">
                        Your reports and volunteer hours over time
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="relative z-10">
                      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={monthlyContributions}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#37415120" />
                            <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={{ stroke: '#D1D5DB' }} />
                            <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={{ stroke: '#D1D5DB' }} />
                            <Tooltip contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', border: '1px solid #E5E7EB', borderRadius: '8px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} />
                            <Bar dataKey="reported" fill="#d97706" name="Reports" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="volunteered" fill="#0891b2" name="Volunteer Hours" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </motion.div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Contribution Types Pie Chart */}
                <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.3 }}>
                  <Card className="bg-gradient-to-br from-card via-card to-muted/20 border-border hover-lift relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-secondary/5 via-transparent to-primary/5 opacity-50" />
                    <CardHeader className="relative z-10">
                      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3">
                        <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} className="p-2 bg-secondary/10 rounded-full">
                          <Target className="h-6 w-6 text-secondary" />
                        </motion.div>
                        <CardTitle className="text-foreground">Contribution Breakdown</CardTitle>
                      </motion.div>
                      <CardDescription className="text-muted-foreground">Distribution of your community contributions</CardDescription>
                    </CardHeader>

                    <CardContent className="relative z-10">
                      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
                        <ResponsiveContainer width="100%" height={300}>
                          <PieChart>
                            <Pie
                              data={contributionTypes}
                              cx="50%"
                              cy="50%"
                              outerRadius={100}
                              innerRadius={40}
                              fill="#8884d8"
                              dataKey="value"
                              label={({ name, value }) => `${name}: ${value}`}
                              labelLine={false}
                            >
                              {contributionTypes.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} stroke="#fff" strokeWidth={2} />
                              ))}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', border: '1px solid #E5E7EB', borderRadius: '8px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} />
                          </PieChart>
                        </ResponsiveContainer>
                      </motion.div>
                    </CardContent>
                  </Card>
                </motion.div>
              </motion.div>

              {/* Progress Indicators */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <Card className="bg-gradient-to-br from-card via-card to-muted/20 border-border hover-lift relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-accent/5 via-transparent to-primary/5 opacity-50" />
                  <CardHeader className="relative z-10">
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3">
                      <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} className="p-2 bg-accent/10 rounded-full">
                        <Trophy className="h-6 w-6 text-accent" />
                      </motion.div>
                      <CardTitle className="text-foreground">Community Impact Progress</CardTitle>
                    </motion.div>
                    <CardDescription className="text-muted-foreground">Your progress towards community service goals and achievements</CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-6 relative z-10">
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="space-y-3">
                      <div className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-2">
                          <Star className="h-4 w-4 text-yellow-500" />
                          <span className="text-foreground font-medium">Reports Resolution Rate</span>
                        </div>
                        <motion.span animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} className="text-muted-foreground font-semibold">
                          {totalReports === 0 ? 0 : Math.round((resolvedReports / totalReports) * 100)}%
                        </motion.span>
                      </div>
                      <div className="relative">
                        <Progress value={totalReports === 0 ? 0 : (resolvedReports / totalReports) * 100} className="h-3" />
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${totalReports === 0 ? 0 : (resolvedReports / totalReports) * 100}%` }}
                          transition={{ duration: 1, delay: 0.2 }}
                          className="absolute top-0 left-0 h-3 bg-gradient-to-r from-green-400 to-green-600 rounded-full"
                        />
                      </div>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="space-y-3">
                      <div className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-2">
                          <Zap className="h-4 w-4 text-blue-500" />
                          <span className="text-foreground font-medium">Volunteer Hours Goal</span>
                        </div>
                        <motion.span animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 1 }} className="text-muted-foreground font-semibold">
                          {totalVolunteerHours}/20 hours
                        </motion.span>
                      </div>
                      <div className="relative">
                        <Progress value={(totalVolunteerHours / 20) * 100} className="h-3" />
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(totalVolunteerHours / 20) * 100}%` }}
                          transition={{ duration: 1, delay: 0.3 }}
                          className="absolute top-0 left-0 h-3 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full"
                        />
                      </div>
                    </motion.div>

                    {/* Achievement Badges */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-border/50">
                      {[
                        { icon: Award, label: "First Responder", earned: totalReports > 0, color: "text-yellow-500" },
                        { icon: Trophy, label: "Community Hero", earned: totalVolunteerHours >= 10, color: "text-purple-500" },
                        { icon: Star, label: "Impact Maker", earned: resolvedReports >= 5, color: "text-green-500" },
                        { icon: Shield, label: "Guardian", earned: totalReports >= 10, color: "text-blue-500" }
                      ].map((badge, index) => (
                        <motion.div
                          key={badge.label}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.5 + index * 0.1 }}
                          whileHover={{ scale: 1.05, y: -2 }}
                          className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all duration-300 ${badge.earned ? 'border-accent/50 bg-accent/10' : 'border-border/50 bg-muted/20 opacity-50'}`}
                        >
                          <motion.div animate={{ rotate: badge.earned ? [0, 5, -5, 0] : 0 }} transition={{ duration: 2, repeat: badge.earned ? Infinity : 0, ease: "easeInOut" }} className={`p-2 rounded-full ${badge.earned ? 'bg-accent/20' : 'bg-muted/50'}`}>
                            <badge.icon className={`h-5 w-5 ${badge.color}`} />
                          </motion.div>
                          <span className={`text-xs font-medium text-center ${badge.earned ? 'text-foreground' : 'text-muted-foreground'}`}>{badge.label}</span>
                        </motion.div>
                      ))}
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            {/* Reported Problems Tab */}
            <TabsContent value="reported" className="space-y-6">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <Card className="bg-gradient-to-br from-card via-card to-muted/20 border-border hover-lift relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-secondary/5 opacity-50" />
                  <CardHeader className="relative z-10">
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3">
                      <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} className="p-2 bg-primary/10 rounded-full">
                        <FileText className="h-6 w-6 text-primary" />
                      </motion.div>
                      <CardTitle className="text-foreground">Problems I Reported</CardTitle>
                    </motion.div>
                    <CardDescription className="text-muted-foreground">Emergency incidents you've reported to the community</CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4 relative z-10">
                    {reportedIncidents.map((incident, index) => (
                      <motion.div
                        key={incident.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        whileHover={{ scale: 1.02, y: -2 }}
                        className="p-5 rounded-xl border border-border bg-background hover:bg-muted/50 hover:border-primary/50 transition-all duration-300 cursor-pointer group"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3 flex-wrap">
                            <motion.div whileHover={{ scale: 1.05 }} className={`px-3 py-1.5 rounded-full text-sm font-medium ${getPriorityColor(incident.priority)} shadow-sm`}>
                              {incident.type}
                            </motion.div>
                            <motion.div whileHover={{ scale: 1.05 }} className={`px-3 py-1.5 rounded-full text-sm font-medium ${getStatusColor(incident.status)} border`}>
                              <div className="flex items-center gap-2">
                                <motion.div animate={{ rotate: [0, 5, -5, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}>
                                  {getStatusIcon(incident.status)}
                                </motion.div>
                                {incident.status}
                              </div>
                            </motion.div>
                          </div>
                          <motion.div whileHover={{ scale: 1.1 }} className="text-xs text-muted-foreground flex items-center gap-1 bg-muted/50 px-2 py-1 rounded-full">
                            <Calendar className="h-3 w-3" />
                            {new Date(incident.dateReported).toLocaleDateString()}
                          </motion.div>
                        </div>

                        <motion.h3 initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 + index * 0.05 }} className="font-semibold text-foreground mb-3 leading-relaxed group-hover:text-primary transition-colors">
                          {incident.description}
                        </motion.h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          <motion.div whileHover={{ scale: 1.02 }} className="flex items-center gap-2 text-muted-foreground hover:text-accent transition-colors">
                            <motion.div animate={{ x: [0, 2, 0] }} transition={{ duration: 2, repeat: Infinity }}>
                              <MapPin className="h-4 w-4 text-accent" />
                            </motion.div>
                            <span className="font-medium">{incident.location}</span>
                          </motion.div>
                          <motion.div whileHover={{ scale: 1.02 }} className="flex items-center gap-2 text-muted-foreground hover:text-accent transition-colors">
                            <Clock className="h-4 w-4 text-accent" />
                            <span className="font-medium">Response: {incident.responseTime}</span>
                          </motion.div>
                        </div>

                        {incident.status !== 'Resolved' && (
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 + index * 0.05 }} className="mt-4 pt-3 border-t border-border/50">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-muted-foreground">Community Impact</span>
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleDeleteIncident(incident.id)}
                                disabled={deletingIncidentId === incident.id}
                                className="flex items-center gap-1 px-2 py-1 text-xs text-destructive hover:text-destructive/80 hover:bg-destructive/10 rounded transition-colors disabled:opacity-50"
                              >
                                {deletingIncidentId === incident.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Trash2 className="h-3 w-3" />
                                )}
                                Delete
                              </motion.button>
                            </div>
                          </motion.div>
                        )}

                        {incident.status === 'Resolved' && (
                          <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.2 + index * 0.05 }} className="mt-4 pt-3 border-t border-border/50">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">Community Impact</span>
                              <motion.span animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }} className="font-semibold text-green-600">
                                High Impact
                              </motion.span>
                            </div>
                          </motion.div>
                        )}
                      </motion.div>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            {/* Volunteer Work Tab */}
            <TabsContent value="volunteered" className="space-y-6">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <Card className="bg-gradient-to-br from-card via-card to-muted/20 border-border hover-lift relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-secondary/5 via-transparent to-primary/5 opacity-50" />
                  <CardHeader className="relative z-10">
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3">
                      <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} className="p-2 bg-secondary/10 rounded-full">
                        <Heart className="h-6 w-6 text-secondary" />
                      </motion.div>
                      <CardTitle className="text-foreground">Problems I Helped Solve</CardTitle>
                    </motion.div>
                    <CardDescription className="text-muted-foreground">Incidents where you volunteered your time and skills to help the community</CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4 relative z-10">
                    {volunteeredIncidents.map((incident, index) => (
                      <motion.div
                        key={incident.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        whileHover={{ scale: 1.02, y: -2 }}
                        className="p-5 rounded-xl border border-border bg-background hover:bg-muted/50 hover:border-secondary/50 transition-all duration-300 cursor-pointer group"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3 flex-wrap">
                            <motion.div whileHover={{ scale: 1.05 }} className="px-3 py-1.5 rounded-full text-sm font-medium bg-secondary/20 text-secondary border border-secondary/30 shadow-sm">
                              {incident.type}
                            </motion.div>
                            <motion.div whileHover={{ scale: 1.05 }} className={`px-3 py-1.5 rounded-full text-sm font-medium ${getStatusColor(incident.status)} border`}>
                              <div className="flex items-center gap-2">
                                <motion.div animate={{ rotate: [0, 5, -5, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}>
                                  {getStatusIcon(incident.status)}
                                </motion.div>
                                {incident.status}
                              </div>
                            </motion.div>
                          </div>
                          <motion.div whileHover={{ scale: 1.1 }} className="text-xs text-muted-foreground flex items-center gap-1 bg-muted/50 px-2 py-1 rounded-full">
                            <Calendar className="h-3 w-3" />
                            {new Date(incident.dateVolunteered).toLocaleDateString()}
                          </motion.div>
                        </div>

                        <motion.h3 initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 + index * 0.05 }} className="font-semibold text-foreground mb-4 leading-relaxed group-hover:text-secondary transition-colors">
                          {incident.description}
                        </motion.h3>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <motion.div whileHover={{ scale: 1.02 }} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-accent transition-colors">
                            <motion.div animate={{ x: [0, 2, 0] }} transition={{ duration: 2, repeat: Infinity }}>
                              <MapPin className="h-4 w-4 text-accent" />
                            </motion.div>
                            <span className="font-medium">{incident.location}</span>
                          </motion.div>

                          <motion.div whileHover={{ scale: 1.02 }} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-accent transition-colors">
                            <motion.div animate={{ rotate: [0, 5, -5, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}>
                              <Clock className="h-4 w-4 text-accent" />
                            </motion.div>
                            <span className="font-medium">{incident.hoursContributed} hours contributed</span>
                          </motion.div>

                          <motion.div whileHover={{ scale: 1.02 }} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-accent transition-colors">
                            <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}>
                              <Users className="h-4 w-4 text-accent" />
                            </motion.div>
                            <span className="font-medium">Impact: {incident.impact}</span>
                          </motion.div>
                        </div>

                        {incident.status !== 'Resolved' && (
                          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + index * 0.05 }} className="pt-2 flex justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCancelVolunteer(incident.id)}
                              disabled={cancellingIncidentId === incident.id}
                              className="flex items-center gap-2 text-xs"
                            >
                              {cancellingIncidentId === incident.id ? (
                                <>
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                  Cancelling
                                </>
                              ) : (
                                <>Cancel Help</>
                              )}
                            </Button>
                          </motion.div>
                        )}

                        <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.2 + index * 0.05 }} className="pt-3 border-t border-border/50">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Volunteer Impact</span>
                            <motion.span animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }} className="font-semibold text-blue-600">
                              {stats?.communityImpact === 'Very High' ? '25+ people helped' :
                               stats?.communityImpact === 'High' ? '15-24 people helped' :
                               stats?.communityImpact === 'Medium' ? '8-14 people helped' :
                               '5-7 people helped'}
                            </motion.span>
                          </div>
                        </motion.div>
                      </motion.div>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>

      <Footer />
    </div>
  )
}
