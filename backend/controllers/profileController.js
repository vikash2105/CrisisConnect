const User = require('../models/User');
const Incident = require('../models/Incident');

// GET /api/profile - Get authenticated user's profile
const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Find user and exclude password
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Get contribution stats
    const reportedCount = await Incident.countDocuments({ reportedBy: userId });
    const volunteeredCount = await Incident.countDocuments({ volunteers: userId });
    
    // Format response
    const profile = {
      id: user._id,
      fullname: user.fullname,
      email: user.email,
      phone: user.phone,
      bio: user.bio || '',
      skills: user.skills || '',
      serviceLocations: user.serviceLocations || [],
      notifications: user.notifications || {
        emergencyAlerts: true,
        volunteerRequests: true,
        statusUpdates: true,
        weeklyDigest: false
      },
      joinDate: user.createdAt,
      stats: {
        totalContributions: reportedCount + volunteeredCount,
        problemsReported: reportedCount,
        volunteerResponses: volunteeredCount
      }
    };
    
    res.json(profile);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// PUT /api/profile - Update authenticated user's profile
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { fullname, phone, bio, skills, notifications } = req.body;
    
    // Find user
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update fields (only if provided)
    if (fullname !== undefined) user.fullname = fullname;
    if (phone !== undefined) user.phone = phone;
    if (bio !== undefined) user.bio = bio;
    if (skills !== undefined) user.skills = skills;
    if (notifications !== undefined) {
      user.notifications = {
        ...user.notifications,
        ...notifications
      };
    }
    
    // Save updated user
    await user.save();
    
    // Return updated profile (without password)
    const updatedProfile = {
      id: user._id,
      fullname: user.fullname,
      email: user.email,
      phone: user.phone,
      bio: user.bio,
      skills: user.skills,
      serviceLocations: user.serviceLocations,
      notifications: user.notifications,
      joinDate: user.createdAt
    };
    
    res.json({
      message: 'Profile updated successfully',
      profile: updatedProfile
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getProfile,
  updateProfile
};

