const test = require('node:test')
const assert = require('node:assert/strict')

const { _internals } = require('../src/mafabAdapter')

test('mafab catalog source URLs always use www host to avoid redirect loops', () => {
  const catalogs = _internals.CATALOG_SOURCES

  for (const urls of Object.values(catalogs)) {
    for (const url of urls) {
      assert.match(url, /^https:\/\/www\.mafab\.hu\//)
    }
  }
})
