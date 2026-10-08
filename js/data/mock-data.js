export const generateMockData = () => {
  const wards = ['Ward 1', 'Ward 2', 'Ward 3', 'Ward 4', 'Ward 5', 'Ward 6', 'Ward 7', 'Ward 8'];
  const severities = ['healthy', 'warning', 'high-risk', 'critical'];
  const types = ['Storm Water', 'Sewer', 'Mixed'];
  
  const drains = Array.from({length: 30}).map((_, i) => {
    const sev = severities[Math.floor(Math.random() * severities.length)];
    return {
      id: `DR-${1040 + i}`,
      ward: wards[i % 8],
      location: `Street ${i + 1}, ${wards[i % 8]}`,
      coords: [19.0760 + (Math.random()*0.1 - 0.05), 72.8777 + (Math.random()*0.1 - 0.05)],
      severity: sev,
      type: types[i % 3],
      status: sev === 'healthy' ? 'Verified' : 'Reported',
      risk: sev === 'critical' ? 'high' : (sev === 'high-risk' ? 'medium' : 'low'),
      waterLevel: Math.floor(Math.random() * 100),
      blockage: Math.floor(Math.random() * 100),
      lastInspection: Date.now() - Math.random() * 86400000 * 7,
      assignedTeam: null,
    };
  });
  
  return {
    role: 'citizen',
    user: { name: 'Jane Doe', initial: 'JD', credits: 250, level: 'Community Helper' },
    drains,
    reports: [],
    workOrders: [],
    eventLog: [],
    notifications: [],
    rewards: []
  };
};
