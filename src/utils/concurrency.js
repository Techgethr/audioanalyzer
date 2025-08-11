// src/utils/concurrency.js
async function processInBatches(items, batchSize, processFn) {
    const results = [];
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(item => processFn(item).catch(error => {
          console.error(`Error processing item ${item}:`, error);
          return { error: true, message: error.message, item };
        }))
      );
      results.push(...batchResults);
    }
    return results;
  }
  
module.exports = { processInBatches };