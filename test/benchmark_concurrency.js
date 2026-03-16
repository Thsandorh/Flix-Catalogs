const { performance } = require('perf_hooks');

async function sequentialFetch(adapters, id) {
  for (const a of adapters) {
    try {
      const out = await a.fetchMeta({ id });
      if (out?.meta) return { meta: out.meta };
    } catch (e) {}
  }
  return { meta: null };
}

async function concurrentFetch(adapters, id) {
  const promises = adapters.map(a =>
    a.fetchMeta({ id }).then(out => {
      if (out?.meta) return out;
      throw new Error('No meta');
    })
  );
  try {
    return await Promise.any(promises);
  } catch (e) {
    return { meta: null };
  }
}

async function runBenchmark() {
  const mockAdapters = [
    {
      name: 'Slow failing adapter',
      fetchMeta: async () => {
        await new Promise(r => setTimeout(r, 300));
        return { meta: null };
      }
    },
    {
      name: 'Slow succeeding adapter',
      fetchMeta: async () => {
        await new Promise(r => setTimeout(r, 300));
        return { meta: { title: 'Slow Success' } };
      }
    },
    {
      name: 'Fast succeeding adapter',
      fetchMeta: async () => {
        await new Promise(r => setTimeout(r, 50));
        return { meta: { title: 'Fast Success' } };
      }
    }
  ];

  console.log('--- Baseline (Sequential) ---');
  // Run multiple times for average
  let totalTimeSeq = 0;
  for (let i = 0; i < 3; i++) {
    const start = performance.now();
    await sequentialFetch(mockAdapters, 'test-id');
    const end = performance.now();
    totalTimeSeq += (end - start);
  }
  console.log(`Average Sequential Time: ${(totalTimeSeq / 3).toFixed(2)}ms`);

  console.log('\n--- Optimized (Concurrent) ---');
  let totalTimeCon = 0;
  for (let i = 0; i < 3; i++) {
    const start = performance.now();
    await concurrentFetch(mockAdapters, 'test-id');
    const end = performance.now();
    totalTimeCon += (end - start);
  }
  console.log(`Average Concurrent Time: ${(totalTimeCon / 3).toFixed(2)}ms`);

  const improvement = ((totalTimeSeq - totalTimeCon) / totalTimeSeq * 100).toFixed(2);
  console.log(`\nImprovement: ${improvement}%`);
}

runBenchmark().catch(console.error);
