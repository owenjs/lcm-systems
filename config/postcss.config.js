module.exports = {
  parser: 'postcss-scss',
  plugins: {
    autoprefixer: {
      cascade: false
    },
    "postcss-strip-inline-comments": {}
  }
};
