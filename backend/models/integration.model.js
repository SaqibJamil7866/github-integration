const mongoose = require('mongoose');

const integrationSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  provider: {
    type: String,
    required: true,
    enum: ['github', 'gitlab', 'bitbucket'],
    default: 'github'
  },
  providerUserId: {
    type: String,
    required: true
  },
  username: {
    type: String,
    required: true
  },
  email: {
    type: String
  },
  displayName: {
    type: String
  },
  avatarUrl: {
    type: String
  },
  accessToken: {
    type: String,
    required: true
  },
  refreshToken: {
    type: String
  },
  tokenType: {
    type: String,
    default: 'bearer'
  },
  scope: {
    type: String
  },
  profileUrl: {
    type: String
  },
  connectedAt: {
    type: Date,
    default: Date.now
  },
  lastSyncedAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'expired'],
    default: 'active'
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true,
  collection: 'github-integration'
});

// Indexes
integrationSchema.index({ userId: 1, provider: 1 });

// Methods
integrationSchema.methods.toJSON = function() {
  const obj = this.toObject();
  // Don't expose sensitive tokens in JSON responses
  delete obj.accessToken;
  delete obj.refreshToken;
  delete obj.__v;
  return obj;
};

// Statics
integrationSchema.statics.findByUserId = function(userId, provider = 'github') {
  return this.findOne({ userId, provider, status: 'active' });
};

integrationSchema.statics.findOrCreate = async function(data) {
  const existing = await this.findOne({
    userId: data.userId,
    provider: data.provider || 'github'
  });

  if (existing) {
    Object.assign(existing, data, { 
      lastSyncedAt: new Date(),
      status: 'active'
    });
    return await existing.save();
  }

  return await this.create(data);
};

module.exports = mongoose.model('Integration', integrationSchema);

