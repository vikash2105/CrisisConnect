const Incident = require('../models/Incident');
const User = require('../models/User');

// Get all incidents reported by the authenticated user
const getReportedIncidents = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const incidents = await Incident.find({ reportedBy: userId })
      .populate('reportedBy', 'fullname email')
      .populate('volunteers', 'fullname email')
      .sort({ createdAt: -1 });
    
    // Transform data to match frontend expectations
    const transformedIncidents = incidents.map(incident => ({
      id: incident._id,
      type: incident.category,
      description: incident.description,
      location: incident.address,
      dateReported: incident.createdAt,
      status: incident.status,
      priority: getPriority(incident.category),
      responseTime: getResponseTime(incident),
      coordinates: incident.location.coordinates,
      imageUrl: incident.imageUrl,
      volunteers: incident.volunteers.length
    }));
    
    res.json(transformedIncidents);
  } catch (error) {
    console.error("Error fetching reported incidents:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all incidents where the user volunteered
const getVolunteeredIncidents = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const incidents = await Incident.find({ volunteers: userId })
      .populate('reportedBy', 'fullname email')
      .populate('volunteers', 'fullname email')
      .sort({ createdAt: -1 });
    
    // Transform data to match frontend expectations
    const transformedIncidents = incidents.map(incident => ({
      id: incident._id,
      type: incident.category,
      description: incident.description,
      location: incident.address,
      dateVolunteered: getVolunteerDate(incident, userId),
      status: incident.status,
      hoursContributed: calculateHoursContributed(incident),
      impact: calculateImpact(incident),
      coordinates: incident.location.coordinates,
      imageUrl: incident.imageUrl
    }));
    
    res.json(transformedIncidents);
  } catch (error) {
    console.error("Error fetching volunteered incidents:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get contribution statistics for the authenticated user
const getContributionStats = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get reported incidents
    const reportedIncidents = await Incident.find({ reportedBy: userId });
    
    // Get volunteered incidents
    const volunteeredIncidents = await Incident.find({ volunteers: userId });
    
    // Calculate statistics
    const totalReports = reportedIncidents.length;
    const resolvedReports = reportedIncidents.filter(i => i.status === 'Resolved').length;
    const totalVolunteerHours = volunteeredIncidents.reduce((sum, incident) => {
      return sum + calculateHoursContributed(incident);
    }, 0);
    const completedVolunteerWork = volunteeredIncidents.filter(i => i.status === 'Resolved').length;
    
    // Calculate monthly contributions (last 4 months)
    const monthlyData = getMonthlyContributions(reportedIncidents, volunteeredIncidents);
    
    // Calculate contribution types
    const contributionTypes = [
      { name: 'Reports', value: totalReports, color: '#d97706' },
      { name: 'Volunteer Hours', value: totalVolunteerHours, color: '#0891b2' }
    ];
    
    // Determine community impact level
    const impactLevel = getCommunityImpact(totalReports, totalVolunteerHours, resolvedReports);
    
    res.json({
      totalReports,
      resolvedReports,
      totalVolunteerHours,
      completedVolunteerWork,
      monthlyContributions: monthlyData,
      contributionTypes,
      communityImpact: impactLevel
    });
  } catch (error) {
    console.error("Error fetching contribution stats:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Add the authenticated user as a volunteer to an incident
const volunteerForIncident = async (req, res) => {
  try {
    const userId = req.user.id;
    const { incidentId } = req.params;
    
    // Find the incident
    const incident = await Incident.findById(incidentId);
    
    if (!incident) {
      return res.status(404).json({ message: 'Incident not found' });
    }
    
    // Check if user already volunteered
    if (incident.volunteers.includes(userId)) {
      return res.status(400).json({ message: 'You have already volunteered for this incident' });
    }
    
    // Check if user is the reporter
    if (incident.reportedBy.toString() === userId) {
      return res.status(400).json({ message: 'You cannot volunteer for your own reported incident' });
    }
    
    // Add user to volunteers
    incident.volunteers.push(userId);
    
    // Update status to "In Progress" if it was "Pending"
    if (incident.status === 'Pending') {
      incident.status = 'In Progress';
    }
    
    await incident.save();
    
    res.json({ 
      message: 'Successfully volunteered for incident',
      incident: await incident.populate('reportedBy volunteers', 'fullname email')
    });
  } catch (error) {
    console.error("Error volunteering for incident:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Remove the authenticated user from volunteers of an incident
const unvolunteerFromIncident = async (req, res) => {
  try {
    const userId = req.user.id;
    const { incidentId } = req.params;
    
    // Find the incident
    const incident = await Incident.findById(incidentId);
    
    if (!incident) {
      return res.status(404).json({ message: 'Incident not found' });
    }
    
    // Check if user is in volunteers
    if (!incident.volunteers.includes(userId)) {
      return res.status(400).json({ message: 'You are not volunteering for this incident' });
    }
    
    // Remove user from volunteers
    incident.volunteers = incident.volunteers.filter(id => id.toString() !== userId);
    
    // Update status back to "Pending" if no volunteers left and status is "In Progress"
    if (incident.volunteers.length === 0 && incident.status === 'In Progress') {
      incident.status = 'Pending';
    }
    
    await incident.save();
    
    res.json({ 
      message: 'Successfully removed from incident volunteers',
      incident: await incident.populate('reportedBy volunteers', 'fullname email')
    });
  } catch (error) {
    console.error("Error unvolunteering from incident:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Helper function to determine priority based on category
function getPriority(category) {
  const highPriority = ['Fire', 'Medical Emergency', 'Flood', 'Blood Donation'];
  const mediumPriority = [
    'Power Outage',
    'Accident',
    'Food & Water Aid',
    'Shelter Help',
    'Elderly Support',
    'Community Support'
  ];
  
  if (highPriority.includes(category)) {
    return 'high';
  } else if (mediumPriority.includes(category)) {
    return 'medium';
  } else {
    return 'low';
  }
}

// Helper function to calculate response time
function getResponseTime(incident) {
  if (incident.status === 'Pending') {
    return 'N/A';
  }
  
  // Calculate time difference between creation and now or resolution
  const createdAt = new Date(incident.createdAt);
  const now = new Date();
  const diffMinutes = Math.floor((now - createdAt) / (1000 * 60));
  
  if (diffMinutes < 60) {
    return `${diffMinutes} minutes`;
  } else {
    const hours = Math.floor(diffMinutes / 60);
    return `${hours} hour${hours > 1 ? 's' : ''}`;
  }
}

// Helper function to get volunteer date (using incident creation date for now)
function getVolunteerDate(incident, userId) {
  // In a real application, you'd track when each volunteer joined
  // For now, we'll use the incident creation date
  return incident.createdAt;
}

// Helper function to calculate hours contributed
function calculateHoursContributed(incident) {
  // In a real application, you'd track actual hours worked
  // For now, we'll estimate based on incident status and type
  if (incident.status === 'Resolved') {
    const highEffortCategories = ['Fire', 'Flood', 'Medical Emergency', 'Blood Donation'];
    return highEffortCategories.includes(incident.category) ? 4 : 2;
  } else if (incident.status === 'In Progress') {
    return 2;
  }
  return 0;
}

// Helper function to calculate impact
function calculateImpact(incident) {
  const impacts = {
    'Fire': 'Helped protect property',
    'Flood': 'Protected multiple homes',
    'Medical Emergency': 'Provided medical assistance',
    'Accident': 'Managed traffic flow',
    'Power Outage': 'Assisted affected residents',
    'Blood Donation': 'Supported critical medical needs',
    'Food & Water Aid': 'Supplied essential resources',
    'Shelter Help': 'Organized safe shelter',
    'Elderly Support': 'Assisted vulnerable residents',
    'Lost Pet': 'Reunited families with pets',
    'Cleanup Drive': 'Restored community areas',
    'Community Support': 'Coordinated neighborhood aid',
    'Other': 'Provided community support'
  };
  
  return impacts[incident.category] || 'Made a positive impact';
}

// Helper function to get monthly contributions
function getMonthlyContributions(reportedIncidents, volunteeredIncidents) {
  const months = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];
  const now = new Date();
  const monthlyData = [];
  
  // Get last 4 months
  for (let i = 3; i >= 0; i--) {
    const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthName = months[targetDate.getMonth()];
    
    const reported = reportedIncidents.filter(incident => {
      const incidentDate = new Date(incident.createdAt);
      return incidentDate.getMonth() === targetDate.getMonth() && 
             incidentDate.getFullYear() === targetDate.getFullYear();
    }).length;
    
    const volunteered = volunteeredIncidents.filter(incident => {
      const incidentDate = new Date(incident.createdAt);
      return incidentDate.getMonth() === targetDate.getMonth() && 
             incidentDate.getFullYear() === targetDate.getFullYear();
    }).reduce((sum, incident) => sum + calculateHoursContributed(incident), 0);
    
    monthlyData.push({ month: monthName, reported, volunteered });
  }
  
  return monthlyData;
}

// Delete an incident reported by the authenticated user
const deleteIncident = async (req, res) => {
  try {
    const userId = req.user.id;
    const { incidentId } = req.params;

    // Find the incident
    const incident = await Incident.findById(incidentId);

    if (!incident) {
      return res.status(404).json({ message: 'Incident not found' });
    }

    // Check if user is the reporter
    if (incident.reportedBy.toString() !== userId) {
      return res.status(403).json({ message: 'You can only delete incidents you reported' });
    }

    // Check if incident is already resolved (might want to prevent deletion of resolved incidents)
    if (incident.status === 'Resolved') {
      return res.status(400).json({ message: 'Cannot delete resolved incidents' });
    }

    // Delete the incident
    await Incident.findByIdAndDelete(incidentId);

    res.json({
      message: 'Incident deleted successfully',
      deletedIncidentId: incidentId
    });
  } catch (error) {
    console.error("Error deleting incident:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Helper function to determine community impact level
function getCommunityImpact(totalReports, totalVolunteerHours, resolvedReports) {
  const score = (totalReports * 2) + (totalVolunteerHours * 3) + (resolvedReports * 5);

  if (score >= 50) return 'Very High';
  if (score >= 30) return 'High';
  if (score >= 15) return 'Medium';
  return 'Low';
}

module.exports = {
  getReportedIncidents,
  getVolunteeredIncidents,
  getContributionStats,
  volunteerForIncident,
  unvolunteerFromIncident,
  deleteIncident
};

