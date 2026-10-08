export const schemas = {
  report: {
    issue: (val) => (!val || val === '') ? "Please select an issue type." : null,
    location: (val) => (!val || val === '') ? "Please confirm a location." : null,
    photo: (val) => (!val) ? "A photo is required for AI verification." : null,
    description: (val) => null // optional
  }
};
