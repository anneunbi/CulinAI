import { NextApiRequest, NextApiResponse } from 'next';
import Replicate from 'replicate';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.REPLICATE_API_TOKEN) {
    return res.status(500).json({ 
      error: 'REPLICATE_API_TOKEN environment variable is not set' 
    });
  }

  try {
    const { id } = req.query;
    
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Invalid prediction ID' });
    }

    const prediction = await replicate.predictions.get(id);

    if (prediction?.error) {
      return res.status(500).json({ error: prediction.error });
    }

    return res.status(200).json(prediction);
  } catch (error) {
    console.error('Prediction get API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
}
