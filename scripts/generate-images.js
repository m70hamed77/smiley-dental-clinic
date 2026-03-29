import ZAI from 'z-ai-web-dev-sdk';
import fs from 'fs';
import path from 'path';

const imagesToGenerate = [
  {
    name: 'video-bg.jpg',
    prompt: 'Dental clinic modern background, professional medical environment with soft blue and teal colors, dental tools in background, high quality photograph',
    size: '1344x768'
  },
  {
    name: 'video-poster.jpg',
    prompt: 'Dental platform demo video thumbnail, modern clean design with dental icon, play button overlay, professional blue gradient background, high quality',
    size: '1344x768'
  }
];

async function generateImages() {
  console.log('Starting image generation...');

  const zai = await ZAI.create();
  const outputDir = path.join(process.cwd(), 'public', 'img');

  // Ensure directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  for (const image of imagesToGenerate) {
    try {
      console.log(`Generating ${image.name}...`);

      const response = await zai.images.generations.create({
        prompt: image.prompt,
        size: image.size
      });

      const imageBase64 = response.data[0].base64;
      const buffer = Buffer.from(imageBase64, 'base64');
      const outputPath = path.join(outputDir, image.name);

      fs.writeFileSync(outputPath, buffer);

      console.log(`✅ Generated: ${image.name} (${buffer.length} bytes)`);
    } catch (error) {
      console.error(`❌ Failed to generate ${image.name}:`, error.message);
    }
  }

  console.log('Image generation complete!');
}

generateImages().catch(console.error);
