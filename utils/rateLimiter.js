const pLimit = require('p-limit').default || require('p-limit');

// Create a concurrency limiter (limits to 5 concurrent operations)
const limit = pLimit(5);

// Utility functions for rate limiting operations
const rateLimiter = {
  // Limit concurrent database operations
  async limitDbOperations(operations) {
    try {
      const results = await Promise.all(
        operations.map(op => limit(() => op()))
      );
      return results;
    } catch (error) {
      throw new Error(`Database operations failed: ${error.message}`);
    }
  },

  // Limit concurrent API calls
  async limitApiCalls(apiCalls) {
    try {
      const results = await Promise.all(
        apiCalls.map(call => limit(() => call()))
      );
      return results;
    } catch (error) {
      throw new Error(`API calls failed: ${error.message}`);
    }
  },

  // Limit concurrent file processing
  async limitFileProcessing(files, processFunction) {
    try {
      const results = await Promise.all(
        files.map(file => limit(() => processFunction(file)))
      );
      return results;
    } catch (error) {
      throw new Error(`File processing failed: ${error.message}`);
    }
  },

  // Limit concurrent image uploads
  async limitImageUploads(images, uploadFunction) {
    try {
      const results = await Promise.all(
        images.map(image => limit(() => uploadFunction(image)))
      );
      return results;
    } catch (error) {
      throw new Error(`Image uploads failed: ${error.message}`);
    }
  },

  // Process batch operations with concurrency control
  async processBatch(dataArray, processor, batchSize = 10) {
    try {
      const batches = [];
      
      // Split data into batches
      for (let i = 0; i < dataArray.length; i += batchSize) {
        batches.push(dataArray.slice(i, i + batchSize));
      }

      // Process each batch with concurrency limit
      const batchResults = await Promise.all(
        batches.map(batch => 
          limit(() => {
            return Promise.all(batch.map(item => processor(item)));
          })
        )
      );

      // Flatten results
      return batchResults.flat();
    } catch (error) {
      throw new Error(`Batch processing failed: ${error.message}`);
    }
  },

  // Queue operations with priority
  createPriorityQueue() {
    const queue = [];
    let isProcessing = false;

    return {
      add: (operation, priority = 0) => {
        queue.push({ operation, priority });
        queue.sort((a, b) => b.priority - a.priority);
        
        if (!isProcessing) {
          processQueue();
        }
      },
      
      async processQueue() {
        isProcessing = true;
        
        while (queue.length > 0) {
          const { operation } = queue.shift();
          await limit(operation);
        }
        
        isProcessing = false;
      }
    };
  }
};

// Example usage functions
const examples = {
  // Example: Limit concurrent product creation
  async createProductsConcurrently(products) {
    const createOperations = products.map(product => () => {
      // Your product creation logic here
      return new Promise(resolve => {
        setTimeout(() => {
          console.log(`Created product: ${product.name}`);
          resolve({ success: true, product });
        }, Math.random() * 1000);
      });
    });

    return await rateLimiter.limitDbOperations(createOperations);
  },

  // Example: Limit concurrent image uploads
  async uploadImagesConcurrently(images) {
    const uploadOperations = images.map(image => () => {
      // Your image upload logic here
      return new Promise(resolve => {
        setTimeout(() => {
          console.log(`Uploaded image: ${image.filename}`);
          resolve({ success: true, url: `https://example.com/${image.filename}` });
        }, Math.random() * 1500);
      });
    });

    return await rateLimiter.limitApiCalls(uploadOperations);
  }
};

module.exports = {
  limit,
  rateLimiter,
  examples
};