const Credential = require('../models/credentialModel');
const User = require('../models/userModel');

// Helper to compute start date based on range
function rangeToStartDate(range) {
  const now = new Date();
  const d = new Date(now);
  switch (range) {
    case '90d':
      d.setDate(d.getDate() - 90);
      return d;
    case '30d':
      d.setDate(d.getDate() - 30);
      return d;
    case '7d':
    default:
      d.setDate(d.getDate() - 7);
      return d;
  }
}

// GET /api/employer/analytics
// Returns employer-facing analytics derived from available data
// Note: Some true employer KPIs (hires, interviews, offer acceptance) are not tracked yet;
// those fields are returned as null so the frontend can gracefully fallback.
const getAnalytics = async (req, res) => {
  try {
    const { range = '7d' } = req.query;
    const startDate = rangeToStartDate(range);

    // 1) KPI: credentialsVerified in range
    const credentialsVerified = await Credential.countDocuments({
      status: 'verified',
      createdAt: { $gte: startDate }
    });

    // 2) Time series: credentials created per day in range (as a proxy for activity/search interest)
    const groupFormat = '%Y-%m-%d';
    const timeSeriesAgg = await Credential.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: groupFormat, date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const searchesOverTime = timeSeriesAgg.map((t) => ({ date: t._id, count: t.count }));

    // 3) Credentials by type (verified only)
    const byTypeAgg = await Credential.aggregate([
      { $match: { status: 'verified', createdAt: { $gte: startDate } } },
      { $group: { _id: { $ifNull: ['$type', 'certificate'] }, count: { $sum: 1 } } },
      { $project: { type: '$_id', count: 1, _id: 0 } },
      { $sort: { count: -1 } }
    ]);
    const credsByType = byTypeAgg;

    // 4) Simple pipeline approximation (learners with any credentials -> with verified -> with on-chain)
    // Note: Not a real hiring pipeline; provided for visual only until hiring data model exists
    const learnerIdsWithAny = await Credential.distinct('user');
    const learnerIdsWithVerified = await Credential.distinct('user', { status: 'verified' });
    const learnerIdsWithOnChain = await Credential.distinct('user', { transactionHash: { $exists: true, $ne: null } });
    const pipeline = [
      { stage: 'With Credentials', value: learnerIdsWithAny.length },
      { stage: 'With Verified', value: learnerIdsWithVerified.length },
      { stage: 'On-Chain', value: learnerIdsWithOnChain.length }
    ];

    // Hire sources are not tracked yet
    const hireSources = [];

    // Other KPIs aren't tracked yet
    const kpis = {
      candidatesHired: null,
      credentialsVerified,
      profileSearches: null,
      interviewsScheduled: null,
      offerAcceptance: null
    };

    res.json({
      success: true,
      data: {
        kpis,
        searchesOverTime,
        credsByType,
        pipeline,
        hireSources
      }
    });
  } catch (error) {
    console.error('Employer analytics error:', error);
    res.status(500).json({ success: false, message: 'Failed to get employer analytics' });
  }
};

module.exports = { getAnalytics };
