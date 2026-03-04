// MemeTee Configuration

window.MEMETEE_CONFIG = {
  api: {
    generateMeme: '/api/generate-meme',
    contact: '/api/contact',
    health: '/api/health',
  },

  upload: {
    maxFileSize: 10 * 1024 * 1024,
    acceptedTypes: ['image/jpeg', 'image/png', 'image/gif'],
  },

  pricing: {
    price: 22.99,
    currency: 'EUR',
  },

  business: {
    name: 'MemeTee',
    email: 'hello@memetee.com',
    location: 'Belgium',
  },
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = window.MEMETEE_CONFIG;
}
