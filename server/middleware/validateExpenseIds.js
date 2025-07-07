const { ObjectId } = require('mongodb');

module.exports = function validateExpenseIds(req, res, next) {
  try {
    // For GET requests with IDs in query
    if (req.query.ids) {
      const ids = Array.isArray(req.query.ids) ? req.query.ids : [req.query.ids];
      const validIds = ids.filter(id => ObjectId.isValid(id));
      req.validatedIds = validIds;
    }
    
    // For POST/PUT requests with body
    if (req.body && (req.body._id || req.body.ids)) {
      if (req.body._id && !ObjectId.isValid(req.body._id)) {
        return res.status(400).json({ message: 'Invalid expense ID format' });
      }
      if (req.body.ids) {
        const ids = Array.isArray(req.body.ids) ? req.body.ids : [req.body.ids];
        const invalidIds = ids.filter(id => !ObjectId.isValid(id));
        if (invalidIds.length > 0) {
          return res.status(400).json({ 
            message: 'Invalid expense ID(s) found',
            invalidIds
          });
        }
      }
    }
    
    next();
  } catch (error) {
    console.error('ID validation error:', error);
    res.status(500).json({ message: 'ID validation failed' });
  }
};