import { generateText } from 'ai';
import { google } from '@ai-sdk/google';
import fs from 'node:fs';
import 'dotenv/config';

async function editImage() {
  const editResult = await generateText({
    model: google('gemini-2.5-flash-image'),
    prompt: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: '', // TODO: Add detailed prompt here. This prompt will be crafted in detail from another LLM/agent.
          },
          {
            type: 'image',
            // image: DataContent (string | Uint8Array | ArrayBuffer | Buffer) or URL
            image:'', // TODO: Add base image here
            mediaType: 'image/jpeg',
          },
        ],
      },
    ],
  });

  // Save the edited image
  const timestamp = Date.now();
  fs.mkdirSync('output', { recursive: true });

  for (const file of editResult.files) {
    if (file.mediaType.startsWith('image/')) {
      await fs.promises.writeFile(
        `output/edited-${timestamp}.png`,
        file.uint8Array,
      );
      console.log(`Saved edited image: output/edited-${timestamp}.png`);
    }
  }
}

editImage().catch(console.error);