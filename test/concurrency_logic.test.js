const test = require('node:test');
const assert = require('node:assert/strict');

test('concurrent logic isolation test', async () => {
  const adapters = [
    {
      fetch: async () => {
        await new Promise(r => setTimeout(r, 100));
        return { data: 'slow' };
      }
    },
    {
      fetch: async () => {
        await new Promise(r => setTimeout(r, 10));
        return { data: 'fast' };
      }
    }
  ];

  const promises = adapters.map(a =>
    a.fetch().then(out => {
      if (out?.data) return out;
      throw new Error('fail');
    })
  );

  const result = await Promise.any(promises);
  assert.equal(result.data, 'fast');
});

test('concurrent logic handles all failures', async () => {
  const adapters = [
    {
      fetch: async () => ({ data: null })
    },
    {
      fetch: async () => { throw new Error('error') }
    }
  ];

  const promises = adapters.map(a =>
    a.fetch().then(out => {
      if (out?.data) return out;
      throw new Error('fail');
    })
  );

  await assert.rejects(Promise.any(promises), {
    name: 'AggregateError'
  });
});
