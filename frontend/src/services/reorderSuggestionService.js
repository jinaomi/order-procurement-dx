const get = (axiosPrivate, includeReasoning = false) => {
  return axiosPrivate.get(`/api/reorderSuggestion?includeReasoning=${includeReasoning}`);
};

const getReasoning = (axiosPrivate, productId) => {
  return axiosPrivate.get(`/api/reorderSuggestion/${productId}/reasoning`);
};

const reorderSuggestionService = { get, getReasoning };

export default reorderSuggestionService;
