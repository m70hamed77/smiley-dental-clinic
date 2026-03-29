import ZAI from 'z-ai-web-dev-sdk';
import fs from 'fs';

const imagesData = JSON.parse(fs.readFileSync('/tmp/images_data.json', 'utf-8'));

async function analyzeAllImages() {
  const zai = await ZAI.create();

  const prompt = `Please analyze these images carefully. The user says they are showing a problem and its solution in a Next.js project.

Please identify:
1. What is the problem shown in these images?
2. What is the proposed solution?
3. What specific code changes need to be made?

Please be very specific and detailed about the exact code changes needed.`;

  const content = [
    { type: 'text', text: prompt },
    ...imagesData.map(img => ({
      type: 'image_url',
      image_url: { url: img.data }
    }))
  ];

  const response = await zai.chat.completions.createVision({
    messages: [
      {
        role: 'user',
        content: content
      }
    ],
    thinking: { type: 'enabled' }
  });

  console.log('Analysis Result:');
  console.log(response.choices[0]?.message?.content);
}

analyzeAllImages().catch(console.error);
