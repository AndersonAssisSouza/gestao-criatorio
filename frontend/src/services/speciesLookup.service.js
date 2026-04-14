import api from './api'

export const speciesLookupService = {
  async enrich(query) {
    const { data } = await api.get('/api/species/lookup', {
      params: { q: query },
    })

    return data
  },
}
