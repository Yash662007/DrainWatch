export const rewardConfig = {
  actions: {
    verifiedReport: 25,
    photoEvidence: 10,
    accurateLocation: 5,
    confirmValidIssue: 10,
    resolutionFeedback: 15,
    cleanupParticipation: 30,
    invalidReport: -20
  },
  levels: [
    { name: 'Citizen', min: 0, max: 99 },
    { name: 'Community Helper', min: 100, max: 299 },
    { name: 'Civic Contributor', min: 300, max: 599 },
    { name: 'Community Guardian', min: 600, max: 999 },
    { name: 'Civic Champion', min: 1000, max: 1999 },
    { name: 'Waste Warrior', min: 2000, max: Infinity }
  ],
  badges: [
    { id: 'first-reporter', name: 'First Reporter', icon: 'flag', desc: 'Submit your first valid report', threshold: 1, type: 'reports' },
    { id: 'verified-eye', name: 'Verified Eye', icon: 'eye', desc: 'Maintain 90% report accuracy', threshold: 90, type: 'accuracy' },
    { id: 'local-watcher', name: 'Local Watcher', icon: 'map-pin', desc: 'Report 5 issues in one ward', threshold: 5, type: 'ward-reports' },
    { id: 'community-helper', name: 'Community Helper', icon: 'users', desc: 'Earn 300 Civic Credits', threshold: 300, type: 'credits' },
    { id: 'monsoon-guardian', name: 'Monsoon Guardian', icon: 'cloud-rain', desc: 'Active reporting during monsoon season', threshold: 1, type: 'seasonal' },
    { id: 'civic-champion', name: 'Civic Champion', icon: 'award', desc: 'Reach Civic Champion level', threshold: 1000, type: 'credits' }
  ]
};

export function calculateLevel(credits) {
  return rewardConfig.levels.find(l => credits >= l.min && credits <= l.max) || rewardConfig.levels[0];
}
