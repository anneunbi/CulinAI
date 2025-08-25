import { NextApiRequest, NextApiResponse } from 'next';
import Replicate from 'replicate';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.REPLICATE_API_TOKEN) {
    console.error('REPLICATE_API_TOKEN is not set');
    return res.status(500).json({ error: 'API token not configured' });
  }

  const { prompt, image } = req.body;

  if (!image || !prompt) {
    return res.status(400).json({ error: 'Image and prompt are required' });
  }

  try {
    console.log('Creating food analysis prediction');
    
    const prediction = await replicate.predictions.create({
      version: 'b5f6212d032508382d61ff00469ddda3e32fd8a0e75dc39d8a4191bb742157fb',
      input: {
        prompt: prompt,
        image: image,
      },
    });

    console.log('Food analysis prediction created:', prediction.id);
    res.status(201).json(prediction);
  } catch (error) {
    console.error('Error creating food analysis prediction:', error);
    res.status(500).json({ error: 'Failed to create prediction' });
  }
} 
