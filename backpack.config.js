module.exports = {
  webpack: (config, options, webpack) => {
    console.log(config);
    config.entry.main = ['./server/index.js'];
    options.exports = {
      output: {
        hashFunction: "sha256"
      }
    }
    return config;
  },
};
