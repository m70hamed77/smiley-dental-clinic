import ZAI from 'z-ai-web-dev-sdk'
import fs from 'fs'

async function analyzeImages() {
  const zai = await ZAI.create()

  const imageFiles = [
    'pasted_image_1770664460323.png',
    'pasted_image_1770672240000.png',
    'pasted_image_1770672830114.png',
    'pasted_image_1770673414003.png',
    'pasted_image_1770749250416.png',
    'pasted_image_1770760940981.png',
    'pasted_image_1771770295759.png',
    'pasted_image_1771895520784.png',
    'pasted_image_1772190935021.png',
    '0.jpg'
  ]

  for (const fileName of imageFiles) {
    const filePath = `/home/z/my-project/upload/${fileName}`

    if (!fs.existsSync(filePath)) {
      console.log(`File not found: ${fileName}`)
      continue
    }

    console.log(`\n=== Analyzing ${fileName} ===`)

    try {
      const imageBuffer = fs.readFileSync(filePath)
      const base64Image = imageBuffer.toString('base64')
      const mimeType = fileName.endsWith('.jpg') ? 'image/jpeg' : 'image/png'

      const prompt = `Describe this screenshot in detail. What is shown? Are there any error messages? What is the user interface showing? If there are Arabic texts, transcribe them. If there's an error, explain what it means.`

      const response = await zai.chat.completions.createVision({
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${base64Image}`
                }
              }
            ]
          }
        ],
        thinking: { type: 'disabled' }
      })

      console.log(response.choices[0]?.message?.content)
    } catch (error: any) {
      console.error(`Error analyzing ${fileName}:`, error.message)
    }
  }
}

analyzeImages()
