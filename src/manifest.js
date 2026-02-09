function createManifest(config) {
  const sources = []
  if (config?.sources?.mafab) sources.push('Mafab')
  if (config?.sources?.porthu) sources.push('Port.hu')

  const catalogs = []

  if (config?.sources?.mafab) {
    catalogs.push(
      { type: 'movie', id: 'mafab-movies', name: 'Mafab: Filmek', extra: [{ name: 'genre' }, { name: 'skip' }] },
      { type: 'movie', id: 'mafab-series', name: 'Mafab: Sorozatok', extra: [{ name: 'genre' }, { name: 'skip' }] },
      { type: 'movie', id: 'mafab-streaming', name: 'Mafab: Top streaming', extra: [{ name: 'genre' }, { name: 'skip' }] },
      { type: 'movie', id: 'mafab-cinema', name: 'Mafab: Moziban most', extra: [{ name: 'genre' }, { name: 'skip' }] }
    )
  }

  if (config?.sources?.porthu) {
    catalogs.push({
      type: 'movie',
      id: 'porthu-mixed',
      name: 'Port.hu: Film és sorozat',
      extra: [{ name: 'genre' }, { name: 'skip' }]
    })
  }


  return {
    id: 'community.hu.multisource.catalog',
    version: '2.0.0',
    name: 'HU Movies & Series Catalog',
    description: `Configurable catalog from ${sources.length ? sources.join(' + ') : 'selected sources'}.`,
    resources: ['catalog', 'meta', 'stream'],
    types: ['movie', 'series'],
    idPrefixes: ['tt', 'mafab:', 'porthu:'],
    catalogs,
    behaviorHints: {
      configurable: true,
      configurationRequired: false
    }
  }
}

module.exports = { createManifest }
