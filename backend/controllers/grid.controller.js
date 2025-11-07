const Organization = require('../models/organization.model');
const Repository = require('../models/repository.model');

/**
 * Get paginated data from any collection with sorting, filtering, and search
 * GET /api/integrations/github/grid-data/:collection
 */
exports.getGridData = async (req, res) => {
  try {
    const { collection } = req.params;
    const { 
      userId,
      page = 1, 
      pageSize = 100,
      sortField,
      sortOrder = 'asc',
      search = '',
      filters = '{}' 
    } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId is required'
      });
    }

    // Validate collection
    const validCollections = ['organizations', 'repositories'];
    if (!validCollections.includes(collection)) {
      return res.status(400).json({
        success: false,
        error: `Invalid collection. Must be one of: ${validCollections.join(', ')}`
      });
    }

    // Get the appropriate model
    const Model = collection === 'organizations' ? Organization : Repository;

    // Build query
    const query = { userId };

    // Parse and apply filters
    try {
      const parsedFilters = JSON.parse(filters);
      Object.keys(parsedFilters).forEach(key => {
        if (parsedFilters[key] !== null && parsedFilters[key] !== undefined && parsedFilters[key] !== '') {
          // Handle different filter types
          if (typeof parsedFilters[key] === 'string') {
            // Text search with case-insensitive regex
            query[key] = { $regex: parsedFilters[key], $options: 'i' };
          } else {
            query[key] = parsedFilters[key];
          }
        }
      });
    } catch (e) {
      console.error('Failed to parse filters:', e);
    }

    // Apply global search across all text fields
    if (search) {
      const searchFields = collection === 'organizations' 
        ? ['login', 'name', 'description']
        : ['name', 'fullName', 'description', 'language', 'organizationLogin'];
      
      query.$or = searchFields.map(field => ({
        [field]: { $regex: search, $options: 'i' }
      }));
    }

    // Build sort
    const sort = {};
    if (sortField) {
      sort[sortField] = sortOrder === 'desc' ? -1 : 1;
    } else {
      sort['lastSyncedAt'] = -1; // Default sort by last synced
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(pageSize);
    const limit = parseInt(pageSize);

    // Execute query with pagination
    const [data, totalCount] = await Promise.all([
      Model.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(), // Use lean for better performance
      Model.countDocuments(query)
    ]);

    // Calculate total pages
    const totalPages = Math.ceil(totalCount / limit);

    res.json({
      success: true,
      data,
      pagination: {
        page: parseInt(page),
        pageSize: limit,
        totalCount,
        totalPages,
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1
      },
      collection
    });
  } catch (error) {
    console.error('Get grid data error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get collection schema/fields for dynamic column generation
 * GET /api/integrations/github/collection-schema/:collection
 */
exports.getCollectionSchema = async (req, res) => {
  try {
    const { collection } = req.params;
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId is required'
      });
    }

    // Validate collection
    const validCollections = ['organizations', 'repositories'];
    if (!validCollections.includes(collection)) {
      return res.status(400).json({
        success: false,
        error: `Invalid collection. Must be one of: ${validCollections.join(', ')}`
      });
    }

    // Get the appropriate model
    const Model = collection === 'organizations' ? Organization : Repository;

    // Get schema paths
    const schema = Model.schema.paths;
    const fields = [];

    // Fields to skip
    const skipFields = ['_id', '__v', 'userId', 'createdAt', 'updatedAt'];

    // Extract field information
    Object.keys(schema).forEach(path => {
      // Skip internal fields and unwanted fields
      if (path.startsWith('_') || path === '__v' || skipFields.includes(path)) return;

      const schemaType = schema[path];
      const field = {
        field: path,
        headerName: path.charAt(0).toUpperCase() + path.slice(1).replace(/([A-Z])/g, ' $1'),
        type: schemaType.instance?.toLowerCase() || 'string',
        sortable: true,
        filter: true
      };

      // Determine if it's a nested object or array
      if (schemaType.schema) {
        field.type = 'object';
        field.children = [];
        Object.keys(schemaType.schema.paths).forEach(subPath => {
          if (!subPath.startsWith('_')) {
            field.children.push({
              field: `${path}.${subPath}`,
              headerName: subPath.charAt(0).toUpperCase() + subPath.slice(1).replace(/([A-Z])/g, ' $1'),
              type: schemaType.schema.paths[subPath].instance?.toLowerCase() || 'string'
            });
          }
        });
      }

      fields.push(field);
    });

    res.json({
      success: true,
      collection,
      fields
    });
  } catch (error) {
    console.error('Get collection schema error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get list of available collections
 * GET /api/integrations/github/collections
 */
exports.getCollections = async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId is required'
      });
    }

    // Get counts for each collection
    const [orgsCount, reposCount] = await Promise.all([
      Organization.countDocuments({ userId }),
      Repository.countDocuments({ userId })
    ]);

    const collections = [
      {
        name: 'organizations',
        label: 'Organizations',
        count: orgsCount,
        description: 'GitHub organizations and user accounts'
      },
      {
        name: 'repositories',
        label: 'Repositories',
        count: reposCount,
        description: 'GitHub repositories with commits, pulls, and issues'
      }
    ];

    res.json({
      success: true,
      collections
    });
  } catch (error) {
    console.error('Get collections error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = exports;

