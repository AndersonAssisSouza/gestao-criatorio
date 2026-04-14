const axios = require('axios')
const sharepointDataRepository = require('../repositories/sharepoint-data.repository')
const curatedSpeciesCatalog = require('../data/curated-species')

const REQUEST_HEADERS = {
  'User-Agent': 'PlumarSpeciesLookup/0.1',
  'Api-User-Agent': 'PlumarSpeciesLookup/0.1',
}

const AXIOS_REQUEST_CONFIG = {
  headers: REQUEST_HEADERS,
  timeout: 10000,
  proxy: false,
}

const MONTH_PATTERN =
  'janeiro|fevereiro|marco|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro|january|february|march|april|may|june|july|august|september|october|november|december'

function normalizeWhitespace(value = '') {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .replace(/\u00A0/g, ' ')
    .trim()
}

function normalizeKey(value = '') {
  return normalizeWhitespace(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function unique(items = []) {
  return [...new Set(items.filter(Boolean).map((item) => normalizeWhitespace(item)))]
}

function mapCuratedSpeciesRecord(record = {}) {
  return {
    especie: normalizeWhitespace(record.especie || ''),
    nomeCientifico: normalizeWhitespace(record.nomeCientifico || ''),
    origem: normalizeWhitespace(record.origem || ''),
    comentarios: normalizeWhitespace(record.comentarios || ''),
    periodoReproducao: normalizeWhitespace(record.periodoReproducao || ''),
    tempoChoco: record.tempoChoco ?? null,
    aliases: Array.isArray(record.aliases) ? record.aliases.map((alias) => normalizeWhitespace(alias)) : [],
  }
}

function firstFilled(...values) {
  return values.find((value) => {
    if (value === null || value === undefined) return false
    if (typeof value === 'number') return true
    return String(value).trim() !== ''
  })
}

function mergeSpeciesProfiles(...profiles) {
  const validProfiles = profiles.filter(Boolean)
  if (!validProfiles.length) return null

  return {
    especie: normalizeWhitespace(firstFilled(...validProfiles.map((profile) => profile.especie)) || ''),
    nomeCientifico: normalizeWhitespace(firstFilled(...validProfiles.map((profile) => profile.nomeCientifico)) || ''),
    origem: normalizeWhitespace(firstFilled(...validProfiles.map((profile) => profile.origem)) || ''),
    comentarios: normalizeWhitespace(firstFilled(...validProfiles.map((profile) => profile.comentarios)) || ''),
    periodoReproducao: normalizeWhitespace(firstFilled(...validProfiles.map((profile) => profile.periodoReproducao)) || ''),
    tempoChoco: firstFilled(...validProfiles.map((profile) => profile.tempoChoco)) ?? null,
  }
}

function profileHasReliableCore(profile = {}) {
  if (!profile) return false

  return Boolean(
    normalizeWhitespace(profile.nomeCientifico).length &&
    normalizeWhitespace(profile.periodoReproducao).length &&
    profile.tempoChoco
  )
}

function findCuratedSpeciesProfile(query = '') {
  const normalizedQuery = normalizeKey(query)

  const exactMatch = curatedSpeciesCatalog.find((record) => {
    const profile = mapCuratedSpeciesRecord(record)
    const keys = [profile.especie, profile.nomeCientifico, ...profile.aliases].map((value) => normalizeKey(value))
    return keys.includes(normalizedQuery)
  })

  if (exactMatch) {
    return mapCuratedSpeciesRecord(exactMatch)
  }

  const partialMatch = curatedSpeciesCatalog.find((record) => {
    const profile = mapCuratedSpeciesRecord(record)
    const keys = [profile.especie, profile.nomeCientifico, ...profile.aliases].map((value) => normalizeKey(value))
    return keys.some((value) => value.includes(normalizedQuery) || normalizedQuery.includes(value))
  })

  return partialMatch ? mapCuratedSpeciesRecord(partialMatch) : null
}

function pickSentences(text = '', maxSentences = 3) {
  const sentences = normalizeWhitespace(text)
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean)

  return sentences.slice(0, maxSentences).join(' ')
}

function summarizeText(text = '', maxLength = 720) {
  const summary = pickSentences(text, 4)
  if (!summary) return ''
  return summary.length <= maxLength ? summary : `${summary.slice(0, maxLength - 1).trim()}...`
}

function mapLocalSpeciesRecord(record = {}) {
  return {
    especie: normalizeWhitespace(record.Especie || ''),
    nomeCientifico: normalizeWhitespace(record.NomeCientifico || ''),
    origem: normalizeWhitespace(record.Origem || ''),
    comentarios: normalizeWhitespace(record.Comentarios || ''),
    periodoReproducao: normalizeWhitespace(record.PeriodoReproducao || ''),
    tempoChoco: record.TempoChoco ?? null,
  }
}

function averageRange(first, second) {
  if (!first) return null
  if (!second) return Number(first)
  return Math.round((Number(first) + Number(second)) / 2)
}

function inferOrigin(text = '') {
  const cleanText = normalizeWhitespace(text)
  if (!cleanText) return ''

  const sentences = cleanText.split(/(?<=[.!?])\s+/)
  const candidate = sentences.find((sentence) =>
    /(origin[aá]ri|nativ|end[eê]mic|distribu[ií]d|encontrad|occurs|found in|native to|from the)/i.test(sentence)
  )

  return normalizeWhitespace(candidate || sentences[0] || '')
}

function inferScientificName(text = '') {
  const cleanText = normalizeWhitespace(text)
  if (!cleanText) return ''

  const patterns = [
    /nome cient[ií]fico:\s*([A-Z][a-z]+(?:\s+[a-z]+){1,3})/i,
    /scientific name:\s*([A-Z][a-z]+(?:\s+[a-z]+){1,3})/i,
    /\(\s*([A-Z][a-z]+(?:\s+[a-z]+){1,3})\s*\)/,
  ]

  for (const pattern of patterns) {
    const match = cleanText.match(pattern)
    if (match?.[1]) {
      return normalizeWhitespace(match[1])
    }
  }

  return ''
}

function inferReproductionPeriod(text = '') {
  const cleanText = normalizeWhitespace(text)
  if (!cleanText) return ''

  const explicitSentence = cleanText
    .split(/(?<=[.!?])\s+/)
    .find((sentence) => /(per[ií]odo de reprodu[cç][aã]o|breeding season|época reprodutiva)/i.test(sentence))

  if (explicitSentence) {
    return normalizeWhitespace(explicitSentence)
  }

  const directPattern = new RegExp(
    `(?:per[ií]odo de reprodu[cç][aã]o|reprodu[cç][aã]o|breeding season|breeds?)([^.]{0,160})`,
    'i'
  )
  const directMatch = cleanText.match(directPattern)
  if (directMatch?.[1]) {
    const snippet = normalizeWhitespace(directMatch[1])
      .replace(/^[:,-]\s*/, '')
      .replace(/\s*\.$/, '')
    if (snippet) return snippet
  }

  const rangePattern = new RegExp(`(${MONTH_PATTERN})\\s+(?:a|to|through|até)\\s+(${MONTH_PATTERN})`, 'i')
  const rangeMatch = cleanText.match(rangePattern)
  if (rangeMatch) {
    return `${rangeMatch[1]} a ${rangeMatch[2]}`
  }

  return ''
}

function inferIncubationDays(text = '') {
  const cleanText = normalizeWhitespace(text)
  if (!cleanText) return null

  const patterns = [
    /(?:incuba(?:ç[aã]o|tion)|tempo de choco|choco)[^.]{0,80}?(\d{1,2})(?:\s*(?:a|-|–)\s*(\d{1,2}))?\s*dias?/i,
    /(\d{1,2})(?:\s*(?:a|-|–)\s*(\d{1,2}))?\s*dias?[^.]{0,80}?(?:incuba(?:ç[aã]o|tion)|tempo de choco|choco)/i,
  ]

  for (const pattern of patterns) {
    const match = cleanText.match(pattern)
    if (match) {
      return averageRange(match[1], match[2])
    }
  }

  return null
}

function buildSearchTerms(query, gbifMatch) {
  return unique([
    query,
    `${query} ave`,
    `${query} pássaro`,
    `${query} bird`,
    `${query} espécie`,
    gbifMatch?.canonicalName,
    gbifMatch?.scientificName,
    gbifMatch?.species,
    gbifMatch?.usage?.scientificName,
  ])
}

async function findLocalSpecies(query) {
  const normalizedQuery = normalizeKey(query)
  const records = await sharepointDataRepository.readCollection('especies')

  const exactMatch = records.find((record) => {
    const especie = normalizeKey(record.Especie)
    const scientific = normalizeKey(record.NomeCientifico)
    return especie === normalizedQuery || scientific === normalizedQuery
  })

  if (exactMatch) {
    return mapLocalSpeciesRecord(exactMatch)
  }

  const partialMatch = records.find((record) => {
    const especie = normalizeKey(record.Especie)
    const scientific = normalizeKey(record.NomeCientifico)
    return especie.includes(normalizedQuery) || normalizedQuery.includes(especie) || scientific.includes(normalizedQuery)
  })

  return partialMatch ? mapLocalSpeciesRecord(partialMatch) : null
}

function looksLikeSpeciesContent(text = '', gbifMatch) {
  const cleanText = normalizeWhitespace(text).toLowerCase()
  if (!cleanText) return false

  if (gbifMatch?.scientificName || gbifMatch?.canonicalName) {
    return true
  }

  return /(ave|aves|pássaro|passaro|bird|species|espécie|taxon|fringillidae|passeriformes|spinus|carduelis|serinus|finch|songbird)/i.test(cleanText)
}

function looselyMatchesQuery(value = '', query = '') {
  const normalizedValue = normalizeWhitespace(value).toLowerCase()
  const normalizedQuery = normalizeWhitespace(query).toLowerCase()

  if (!normalizedValue || !normalizedQuery) return false
  return normalizedValue.includes(normalizedQuery)
}

async function fetchGbifMatch(query) {
  try {
    const { data } = await axios.get('https://api.gbif.org/v1/species/match', {
      ...AXIOS_REQUEST_CONFIG,
      params: { name: query, verbose: true },
    })

    if (!data) return null
    return data
  } catch (_) {
    return null
  }
}

async function searchWikipediaTitle(query, language) {
  const { data } = await axios.get(`https://${language}.wikipedia.org/w/api.php`, {
    ...AXIOS_REQUEST_CONFIG,
    params: {
      action: 'query',
      list: 'search',
      srsearch: query,
      srlimit: 5,
      format: 'json',
    },
  })

  return (data?.query?.search || []).map((item) => item?.title).filter(Boolean)
}

async function fetchWikipediaExtract(title, language) {
  const { data } = await axios.get(`https://${language}.wikipedia.org/w/api.php`, {
    ...AXIOS_REQUEST_CONFIG,
    params: {
      action: 'query',
      prop: 'extracts',
      explaintext: true,
      exchars: 8000,
      redirects: 1,
      titles: title,
      format: 'json',
      formatversion: 2,
    },
  })

  return data?.query?.pages?.[0]?.extract || ''
}

async function fetchWikipediaContext(query, gbifMatch) {
  const searchTerms = buildSearchTerms(query, gbifMatch)
  const languages = ['pt', 'en']

  for (const language of languages) {
    for (const term of searchTerms) {
      try {
        const titles = await searchWikipediaTitle(term, language)
        if (!titles.length) continue

        for (const title of titles) {
          const extract = await fetchWikipediaExtract(title, language)
          if (!extract) continue
          if (!looksLikeSpeciesContent(extract, gbifMatch)) continue
          if (!gbifMatch?.scientificName && !gbifMatch?.canonicalName) {
            const titleOrExtractMatchesQuery =
              looselyMatchesQuery(title, query) ||
              looselyMatchesQuery(extract, query)

            if (!titleOrExtractMatchesQuery) continue
          }

          return {
            language,
            title,
            url: `https://${language}.wikipedia.org/wiki/${encodeURIComponent(title.replace(/\s+/g, '_'))}`,
            extract: normalizeWhitespace(extract),
          }
        }
      } catch (_) {
        // Tentativa silenciosa para o próximo termo/idioma.
      }
    }
  }

  return null
}

async function enrichSpecies(query) {
  const cleanQuery = normalizeWhitespace(query)
  if (!cleanQuery || cleanQuery.length < 3) {
    const error = new Error('Informe pelo menos 3 caracteres para buscar a espécie.')
    error.code = 'INVALID_QUERY'
    throw error
  }

  const curatedSpecies = findCuratedSpeciesProfile(cleanQuery)
  const localSpecies = await findLocalSpecies(cleanQuery)
  const trustedProfile = mergeSpeciesProfiles(localSpecies, curatedSpecies)

  if (profileHasReliableCore(trustedProfile)) {
    return {
      suggested: {
        especie: trustedProfile.especie || cleanQuery,
        nomeCientifico: trustedProfile.nomeCientifico || '',
        origem: trustedProfile.origem || '',
        comentarios: trustedProfile.comentarios || '',
        periodoReproducao: trustedProfile.periodoReproducao || '',
        tempoChoco: trustedProfile.tempoChoco ?? null,
      },
      metadata: {
        curatedMatch: !!curatedSpecies,
        localMatch: !!localSpecies,
        gbifMatchType: '',
        gbifConfidence: null,
        wikipediaLanguage: null,
        wikipediaUrl: null,
      },
    }
  }

  const gbifMatch = await fetchGbifMatch(cleanQuery)
  const wikiContext = await fetchWikipediaContext(cleanQuery, gbifMatch)
  const wikiExtract = wikiContext?.extract || ''
  const inferredProfile = {
    especie: cleanQuery,
    nomeCientifico: normalizeWhitespace(
      inferScientificName(wikiExtract) ||
      gbifMatch?.scientificName ||
      gbifMatch?.canonicalName ||
      gbifMatch?.species
    ),
    origem: inferOrigin(wikiExtract),
    comentarios: summarizeText(wikiExtract),
    periodoReproducao: inferReproductionPeriod(wikiExtract),
    tempoChoco: inferIncubationDays(wikiExtract),
  }
  const finalProfile = mergeSpeciesProfiles(localSpecies, curatedSpecies, inferredProfile)

  if (!finalProfile?.nomeCientifico && !wikiContext && !localSpecies && !curatedSpecies) {
    const error = new Error('Não encontrei uma referência confiável para complementar essa espécie.')
    error.code = 'SPECIES_NOT_FOUND'
    throw error
  }

  return {
    suggested: {
      especie: cleanQuery,
      nomeCientifico: finalProfile?.nomeCientifico || '',
      origem: finalProfile?.origem || '',
      comentarios: finalProfile?.comentarios || '',
      periodoReproducao: finalProfile?.periodoReproducao || '',
      tempoChoco: finalProfile?.tempoChoco ?? null,
    },
    metadata: {
      curatedMatch: !!curatedSpecies,
      localMatch: !!localSpecies,
      gbifMatchType: gbifMatch?.matchType || '',
      gbifConfidence: gbifMatch?.confidence ?? null,
      wikipediaLanguage: wikiContext?.language || null,
      wikipediaUrl: wikiContext?.url || null,
    },
  }
}

module.exports = {
  enrichSpecies,
}
