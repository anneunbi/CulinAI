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

  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  try {
    console.log('Creating image prediction with prompt:', prompt);
    
    const prediction = await replicate.predictions.create({
      version: '8beff3369e81422112d93b89ca01426147de542cd4684c244b673b105188fe5f',
      input: {
        prompt: prompt,
      },
    });

    console.log('Image prediction created:', prediction.id);
    res.status(201).json(prediction);
  } catch (error) {
    console.error('Error creating image prediction:', error);
    res.status(500).json({ error: 'Failed to create image prediction' });
  }
} 
