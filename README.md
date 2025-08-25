# CulinAI 

## Overview

### Purpose

CulinAI is an AI-powered site that allows users to generate recipes by uploading a photo of their fridge or food items.

### Users

CulinAI is for those who:

- Want to try new recipes
- Want to reduce food waste
  -Don’t know what they can cook using the groceries that they already have

### Why?

We wanted to explore the idea of “cooking with nothing.”
CulinAI answers “What should I eat today?” without wasting or buying food.

### User Workflow

- Users upload ingredient photos via an easy-to-use homepage interface
- Uploaded images are analyzed by the LLaVa model to detect ingredients
- LLaVa uses detected ingredients to create and display recipes with Stable Diffusion-generated visuals

## Demo

https://github.com/user-attachments/assets/b4e3a8fe-7e37-4fd2-9273-5e4bec5eb3ae

## Noteworthy files

We used this [Next.js](https://nextjs.org/) template project that's preconfigured to work with Replicate's API.

- [pages/index.js](pages/index.js) - The React frontend that renders the home page in the browser
- [pages/api/predictions/index.js](pages/api/predictions/index.js) - The backend API endpoint that calls Replicate's API to create a prediction
- [pages/api/predictions/[id].js](pages/api/predictions/[id].js) - The backend API endpoint that calls Replicate's API to get the prediction result

## Usage

Install dependencies:

```console
npm install
```

Add your [Replicate API token](https://replicate.com/account#token) to `.env.local`:

```
REPLICATE_API_TOKEN=<your-token-here>
```

Run the development server:

```console
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

For detailed instructions on how to create and use this template, see [replicate.com/docs/get-started/nextjs](https://replicate.com/docs/get-started/nextjs)

<img width="707" alt="iguana" src="https://github.com/user-attachments/assets/4e0f4e7c-da88-410e-95b9-d74e0e58ddf4">
