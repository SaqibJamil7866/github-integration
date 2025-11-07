const mongoose = require('mongoose');

const OrganizationMemberSchema = new mongoose.Schema({
  login: { type: String, required: true },
  id: { type: Number, required: true },
  avatarUrl: String,
  htmlUrl: String,
  type: String,
  siteAdmin: Boolean,
  role: String,
  addedAt: { type: Date, default: Date.now }
}, { _id: false });

const OrganizationSchema = new mongoose.Schema({
  // User/Integration reference
  userId: {
    type: String,
    required: true,
    index: true
  },
  
  // GitHub organization details
  githubId: {
    type: Number,
    required: true
  },
  
  login: {
    type: String,
    required: true,
    index: true
  },
  
  name: String,
  description: String,
  avatarUrl: String,
  htmlUrl: String,
  type: String, // 'Organization' or 'User' (for personal accounts)
  
  // Organization metadata
  metadata: {
    company: String,
    blog: String,
    location: String,
    email: String,
    publicRepos: Number,
    publicGists: Number,
    followers: Number,
    following: Number,
    createdAt: Date,
    updatedAt: Date
  },
  
  // Organization members
  members: [OrganizationMemberSchema],
  
  // Repository count (for quick reference)
  repositoryCount: {
    type: Number,
    default: 0
  },
  
  // Sync metadata
  lastSyncedAt: {
    type: Date,
    default: Date.now
  },
  
  syncStatus: {
    type: String,
    enum: ['pending', 'syncing', 'completed', 'failed'],
    default: 'pending'
  },
  
  syncError: String

}, {
  timestamps: true,
  collection: 'organizations'
});

// Compound index for unique org per user
OrganizationSchema.index({ userId: 1, login: 1 }, { unique: true });
OrganizationSchema.index({ userId: 1, githubId: 1 });

// Static methods
OrganizationSchema.statics.findOrCreate = async function(orgData) {
  const { userId, githubId, login } = orgData;
  
  let organization = await this.findOne({ userId, login });
  
  if (organization) {
    // Update existing
    Object.assign(organization, orgData);
    organization.lastSyncedAt = new Date();
    await organization.save();
  } else {
    // Create new
    organization = await this.create(orgData);
  }
  
  return organization;
};

OrganizationSchema.statics.syncOrganization = async function(userId, orgData, members = []) {
  const organization = await this.findOrCreate({
    userId,
    githubId: orgData.id,
    login: orgData.login,
    name: orgData.name || orgData.login,
    description: orgData.description,
    avatarUrl: orgData.avatar_url,
    htmlUrl: orgData.html_url,
    type: orgData.type,
    metadata: {
      company: orgData.company,
      blog: orgData.blog,
      location: orgData.location,
      email: orgData.email,
      publicRepos: orgData.public_repos,
      publicGists: orgData.public_gists,
      followers: orgData.followers,
      following: orgData.following,
      createdAt: orgData.created_at,
      updatedAt: orgData.updated_at
    },
    members: members.map(member => ({
      login: member.login,
      id: member.id,
      avatarUrl: member.avatar_url,
      htmlUrl: member.html_url,
      type: member.type,
      siteAdmin: member.site_admin,
      role: member.role
    })),
    lastSyncedAt: new Date(),
    syncStatus: 'completed'
  });
  
  return organization;
};

// Instance methods
OrganizationSchema.methods.updateMembers = async function(members) {
  this.members = members.map(member => ({
    login: member.login,
    id: member.id,
    avatarUrl: member.avatar_url,
    htmlUrl: member.html_url,
    type: member.type,
    siteAdmin: member.site_admin,
    role: member.role
  }));
  this.lastSyncedAt = new Date();
  await this.save();
  return this;
};

OrganizationSchema.methods.updateRepositoryCount = async function(count) {
  this.repositoryCount = count;
  await this.save();
  return this;
};

const Organization = mongoose.model('Organization', OrganizationSchema);

module.exports = Organization;

