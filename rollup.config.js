import terser from '@rollup/plugin-terser';

export default {
  input: 'src/exports.js',
	output: {
		file: 'dist/dot-notation.min.js',
	},  
  plugins: [
    terser()
  ]
}