// Custom image loader to bypass Vercel's image optimization
// This allows loading images from any external domain without processing

export default function imageLoader({ src, width, quality }) {
  // Return the original image URL without any optimization
  return src;
}
