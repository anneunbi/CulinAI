import { useState, useRef, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [recipeData, setRecipeData] = useState<any>(null);
  const [outputImage, setOutputImage] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [isScrolled, setIsScrolled] = useState(false);
  
  const imageRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setSelectedImage(result);
      if (imageRef.current) {
        imageRef.current.src = result;
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedImage) {
      return;
    }

    try {
      setLoading(true);

      // Step 1: Analyze the image for food ingredients
      const response = await fetch("/api/predictions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: "You are a JSON generator. You must output ONLY valid JSON with no additional text, explanations, or formatting. Analyze the provided image to identify up to 10 food ingredients and return a JSON object with this exact structure: {\"containsfood\": true, \"fooditems\": [\"ingredient1\", \"ingredient2\"], \"recipe\": {\"title\": \"Recipe Title\", \"ingredients\": [\"amount ingredient1\", \"amount ingredient2\"], \"instructions\": \"step1, step2, step3\", \"cookingtime\": 30, \"difficulty\": 3}}. If no food is detected, use {\"containsfood\": false, \"fooditems\": []}. IMPORTANT: Output ONLY the JSON object, no other text. Ensure all property names are in double quotes, all strings are in double quotes, and the JSON is perfectly formatted with no trailing commas and proper closing braces. Do not include any explanations or additional formatting.",
          image: selectedImage,
        }),
      });

      let prediction = await response.json();
      if (response.status !== 201) {
        throw new Error(prediction.error || 'Failed to create prediction');
      }

      // Wait for the prediction to complete
      while (prediction.status !== "succeeded" && prediction.status !== "failed") {
        await sleep(1000);
        const response = await fetch("/api/predictions/" + prediction.id);
        prediction = await response.json();
        if (response.status !== 200) {
          throw new Error(prediction.error || 'Failed to fetch prediction');
        }
      }

      if (prediction.status === 'failed') {
        throw new Error('Food analysis failed');
      }

      if (!prediction.output) {
        throw new Error('No output received from food analysis');
      }

      // Parse the recipe data with better error handling
      let recipeObj;
      const combinedOutput = prediction.output.join(" ");
      console.log('Raw AI output:', combinedOutput);
      
      try {
        recipeObj = JSON.parse(combinedOutput);
        console.log('JSON parsed successfully on first try');
      } catch (parseError) {
        console.log('Initial JSON parse failed, trying to fix common issues...');
        console.log('Parse error:', parseError instanceof Error ? parseError.message : String(parseError));
        
        // Try to fix common JSON issues
        try {
          let fixedOutput = combinedOutput;
          
          // Remove any text before the first {
          const firstBraceIndex = fixedOutput.indexOf('{');
          if (firstBraceIndex > 0) {
            fixedOutput = fixedOutput.substring(firstBraceIndex);
            console.log('Removed text before first brace');
          }
          
          // Remove any text after the last }
          const lastBraceIndex = fixedOutput.lastIndexOf('}');
          if (lastBraceIndex > 0 && lastBraceIndex < fixedOutput.length - 1) {
            fixedOutput = fixedOutput.substring(0, lastBraceIndex + 1);
            console.log('Removed text after last brace');
          }
          
          // Try to fix missing closing braces
          if (!fixedOutput.trim().endsWith('}')) {
            fixedOutput = fixedOutput + '}';
            console.log('Added missing closing brace');
          }
          
          // Try to fix trailing commas
          fixedOutput = fixedOutput.replace(/,(\s*[}\]])/g, '$1');
          console.log('Fixed trailing commas');
          
          // Try to fix missing quotes around property names
          fixedOutput = fixedOutput.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":');
          console.log('Fixed missing quotes around property names');
          
          console.log('Attempting to parse fixed output:', fixedOutput);
          recipeObj = JSON.parse(fixedOutput);
          console.log('JSON fixed and parsed successfully');
        } catch (secondError) {
          console.error('Failed to fix JSON:', secondError);
          console.error('Original output:', combinedOutput);
          
          // Try one more approach - extract JSON-like content and fix truncation
          try {
            const jsonMatch = combinedOutput.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              let extractedJson = jsonMatch[0];
              console.log('Extracted JSON-like content:', extractedJson);
              
              // Check if the JSON is truncated and try to complete it
              if (!extractedJson.trim().endsWith('}')) {
                console.log('JSON appears to be truncated, attempting to complete...');
                
                // More sophisticated completion based on what we have
                if (extractedJson.includes('"ingredients"') && !extractedJson.includes('"instructions"')) {
                  // Find the last complete ingredient and complete the recipe
                  const lastIngredientMatch = extractedJson.match(/"ingredients":\s*\[([^\]]*)\]/);
                  if (lastIngredientMatch) {
                    const ingredients = lastIngredientMatch[1];
                    const ingredientList = ingredients.split(',').map((i: string) => i.trim().replace(/"/g, '')).filter((i: string) => i);
                    
                    // Create a more detailed recipe based on available ingredients
                    const recipeTitle = extractedJson.match(/"title":\s*"([^"]*)"/)?.[1] || "Delicious Recipe";
                    
                    // Generate more realistic instructions based on ingredients
                    let instructions = "";
                    if (ingredientList.length >= 3) {
                      // Check if this is a sweet/dessert recipe
                      const isSweetRecipe = recipeTitle.toLowerCase().includes('roll') || 
                                          recipeTitle.toLowerCase().includes('cake') || 
                                          recipeTitle.toLowerCase().includes('cookie') || 
                                          recipeTitle.toLowerCase().includes('dessert') ||
                                          recipeTitle.toLowerCase().includes('sweet') ||
                                          ingredientList.some((ing: string) => ing.toLowerCase().includes('sugar') || 
                                                                   ing.toLowerCase().includes('cinnamon') ||
                                                                   ing.toLowerCase().includes('vanilla'));
                      
                      if (isSweetRecipe) {
                        instructions = `Preheat your oven to 350°F (175°C) and prepare your baking pan. In a large mixing bowl, combine ${ingredientList[0]} and ${ingredientList[1]} until well mixed. Gradually add ${ingredientList[2]} while stirring continuously. Mix in any additional flavorings like vanilla or spices. Pour the mixture into your prepared pan and bake for 25-30 minutes, or until a toothpick inserted in the center comes out clean. Allow to cool before serving.`;
                      } else {
                        instructions = `Prepare and measure all ingredients. Heat a pan over medium heat and add oil. Sauté ${ingredientList[0]} until fragrant. Add ${ingredientList[1]} and cook for 2-3 minutes. Incorporate ${ingredientList[2]} and season to taste. Cook until all ingredients are well combined and heated through. Serve hot with your preferred accompaniments.`;
                      }
                    } else {
                      instructions = `Gather and prepare all ingredients. Combine ${ingredientList.join(' and ')} in a mixing bowl. Season with salt, pepper, and herbs to enhance the natural flavors. Mix thoroughly until well combined. Let the mixture rest for 10 minutes to allow flavors to meld. Serve immediately or refrigerate for later use.`;
                    }
                    
                    extractedJson = extractedJson.replace(/(\s*)$/, `, "instructions": "${instructions}", "cookingtime": 35, "difficulty": 3}`);
                    console.log('Added detailed recipe fields with smart completion');
                  } else {
                    extractedJson = extractedJson.replace(/(\s*)$/, ', "instructions": "Mix ingredients together and serve", "cookingtime": 30, "difficulty": 3}');
                  }
                } else if (extractedJson.includes('"fooditems"') && !extractedJson.includes('"recipe"')) {
                  // Extract food items and create a complete recipe
                  const foodItemsMatch = extractedJson.match(/"fooditems":\s*\[([^\]]*)\]/);
                  if (foodItemsMatch) {
                    const foodItems = foodItemsMatch[1].split(',').map((i: string) => i.trim().replace(/"/g, '')).filter((i: string) => i);
                    
                    // Create a more detailed recipe based on the food items
                    const recipeTitle = foodItems.length > 0 ? `${foodItems[0].charAt(0).toUpperCase() + foodItems[0].slice(1)} and ${foodItems[1] || 'Vegetables'} Medley` : "Gourmet Recipe";
                    
                    // Generate more realistic ingredients with quantities
                    const ingredients = foodItems.slice(0, Math.min(6, foodItems.length)).map((item: string, index: number) => {
                      const quantities = ['2', '1 cup', '3 tbsp', '1/2 cup', '4', '2 tbsp'];
                      return `${quantities[index] || '1'} ${item}`;
                    });
                    
                    // Generate detailed cooking instructions
                    let instructions = "";
                    if (foodItems.length >= 4) {
                      // Check if this is a sweet/dessert recipe
                      const isSweetRecipe = recipeTitle.toLowerCase().includes('roll') || 
                                          recipeTitle.toLowerCase().includes('cake') || 
                                          recipeTitle.toLowerCase().includes('cookie') || 
                                          recipeTitle.toLowerCase().includes('dessert') ||
                                          recipeTitle.toLowerCase().includes('sweet') ||
                                          foodItems.some((item: string) => item.toLowerCase().includes('sugar') || 
                                                                         item.toLowerCase().includes('cinnamon') ||
                                                                         item.toLowerCase().includes('vanilla'));
                      
                      if (isSweetRecipe) {
                        instructions = `Preheat your oven to 350°F (175°C) and grease a baking pan. In a large mixing bowl, cream together ${foodItems[0]} and ${foodItems[1]} until light and fluffy. Gradually add ${foodItems[2]} while mixing continuously. Fold in ${foodItems[3]} and any additional flavorings. Pour the batter into your prepared pan and bake for 25-30 minutes, or until a toothpick inserted in the center comes out clean. Allow to cool completely before serving.`;
                      } else {
                        instructions = `Begin by preparing your workspace and gathering all necessary equipment. Wash and prepare all fresh ingredients, chopping vegetables and measuring dry ingredients. Heat a large skillet or pan over medium-high heat and add 2-3 tablespoons of cooking oil. Start by sautéing ${foodItems[0]} until it begins to soften and release its natural flavors. Add ${foodItems[1]} and continue cooking for 3-4 minutes, stirring occasionally to prevent sticking. Incorporate ${foodItems[2]} and cook for an additional 2-3 minutes. Add ${foodItems[3]} and season generously with salt, pepper, and complementary herbs and spices. Reduce heat to medium and cook for 5-7 minutes, allowing all flavors to meld together. Taste the mixture and adjust seasoning as needed. Serve hot, garnished with fresh herbs if available, and enjoy your delicious creation.`;
                      }
                    } else if (foodItems.length >= 2) {
                      // Check if this is a sweet/dessert recipe
                      const isSweetRecipe = recipeTitle.toLowerCase().includes('roll') || 
                                          recipeTitle.toLowerCase().includes('cake') || 
                                          recipeTitle.toLowerCase().includes('cookie') || 
                                          recipeTitle.toLowerCase().includes('dessert') ||
                                          recipeTitle.toLowerCase().includes('sweet') ||
                                          foodItems.some((item: string) => item.toLowerCase().includes('sugar') || 
                                                                         item.toLowerCase().includes('cinnamon') ||
                                                                         item.toLowerCase().includes('vanilla'));
                      
                      if (isSweetRecipe) {
                        instructions = `Preheat your oven to 350°F (175°C). In a medium mixing bowl, combine ${foodItems[0]} with ${foodItems[1]} and ${foodItems[2]}. Mix in sugar and spices to taste. Pour the mixture into a greased baking dish and bake for 20-25 minutes, or until golden brown. Allow to cool before serving.`;
                      } else {
                        instructions = `Prepare your workspace and gather all necessary equipment. Clean and prepare ${foodItems[0]} according to your preference. In a medium mixing bowl, combine ${foodItems[0]} with ${foodItems[1]} and ${foodItems[2]}. Season the mixture generously with salt, pepper, and complementary spices. Allow the ingredients to marinate for 15-20 minutes to develop flavors. Heat a pan over medium heat and add a small amount of oil. Cook the mixture, stirring occasionally, until everything is heated through and well combined. Taste and adjust seasoning as needed. Serve immediately while hot and fresh, garnished with herbs if available.`;
                      }
                    } else {
                      instructions = `Carefully prepare and measure all ingredients. In a clean mixing bowl, combine the ingredients thoroughly. Season with salt, pepper, and herbs to enhance the natural flavors. Allow the mixture to rest for 10-15 minutes to develop flavors. Taste and adjust seasoning as needed. Serve in an attractive presentation.`;
                    }
                    
                    extractedJson = extractedJson.replace(/(\s*)$/, `, "recipe": {"title": "${recipeTitle}", "ingredients": ${JSON.stringify(ingredients)}, "instructions": "${instructions}", "cookingtime": 45, "difficulty": 3}}`);
                    console.log('Created detailed recipe from food items');
                  } else {
                    extractedJson = extractedJson.replace(/(\s*)$/, ', "recipe": {"title": "Quick Recipe", "ingredients": ["2 eggs", "1 orange"], "instructions": "Combine ingredients", "cookingtime": 15, "difficulty": 2}}');
                  }
                } else if (extractedJson.includes('"containsfood"') && extractedJson.includes('"fooditems"')) {
                  // We have the basic structure, just need to complete it
                  extractedJson = extractedJson.replace(/(\s*)$/, ', "recipe": {"title": "Simple Recipe", "ingredients": ["2 eggs", "1 orange"], "instructions": "Mix ingredients together", "cookingtime": 15, "difficulty": 1}}');
                  console.log('Completed basic recipe structure');
                } else {
                  // Just close the JSON
                  extractedJson = extractedJson.replace(/(\s*)$/, '}');
                  console.log('Added closing brace');
                }
              }
              
              console.log('Attempting to parse completed JSON:', extractedJson);
              recipeObj = JSON.parse(extractedJson);
              console.log('Completed JSON parsed successfully');
            } else {
              throw new Error('No JSON-like content found');
            }
          } catch (extractError) {
            console.error('Final error:', extractError);
            
            // Last resort: create a detailed recipe from any food items we can find
            try {
              console.log('Attempting to create detailed recipe from partial data...');
              
              // Look for any food items in the output
              const foodItemsMatch = combinedOutput.match(/"fooditems":\s*\[([^\]]*)\]/);
              const titleMatch = combinedOutput.match(/"title":\s*"([^"]*)"/);
              
              if (foodItemsMatch) {
                const foodItems = foodItemsMatch[1].split(',').map((i: string) => i.trim().replace(/"/g, '')).filter((i: string) => i);
                const title = titleMatch?.[1] || "Gourmet Recipe";
                
                // Use the enhanced recipe generation function
                const generateDetailedRecipe = (title: string, ingredients: string[]) => {
                  const isSweet = title.toLowerCase().includes('shake') || title.toLowerCase().includes('smoothie') || 
                                  title.toLowerCase().includes('cake') || title.toLowerCase().includes('cookie') || 
                                  title.toLowerCase().includes('muffin') || title.toLowerCase().includes('brownie') ||
                                  title.toLowerCase().includes('ice cream') || title.toLowerCase().includes('pudding');
                  
                  const isDrink = title.toLowerCase().includes('shake') || title.toLowerCase().includes('smoothie') || 
                                 title.toLowerCase().includes('juice') || title.toLowerCase().includes('tea');
                  
                  let instructions = '';
                  
                  if (isDrink) {
                    instructions = [
                      'Wash and prepare all fresh ingredients thoroughly',
                      'Add liquid ingredients to the blender first, followed by solid ingredients',
                      'Blend on low speed for 30 seconds, then increase to high speed',
                      'Continue blending until the mixture is completely smooth and creamy',
                      'Taste and adjust sweetness or thickness as needed',
                      'Pour into chilled glasses and serve immediately with garnishes'
                    ].join('. ');
                  } else if (isSweet) {
                    instructions = [
                      'Preheat oven to 350°F (175°C) and prepare baking dish with non-stick spray',
                      'In a large mixing bowl, cream together butter and sugar until light and fluffy',
                      'Add eggs one at a time, beating well after each addition',
                      'Gradually mix in dry ingredients, alternating with liquid ingredients',
                      'Gently fold in fresh fruits and nuts until evenly distributed',
                      'Pour batter into prepared dish and bake for 25-30 minutes until golden brown',
                      'Allow to cool completely before serving or storing'
                    ].join('. ');
                  } else {
                    instructions = [
                      'Heat oil in a large skillet over medium-high heat',
                      'Dice vegetables and proteins into uniform pieces for even cooking',
                      'Sauté aromatics (onions, garlic) until fragrant and translucent',
                      'Add proteins and cook until browned on all sides',
                      'Incorporate vegetables and cook until tender-crisp',
                      'Season with herbs, spices, salt, and pepper to taste',
                      'Simmer with liquid ingredients to develop flavors',
                      'Garnish with fresh herbs and serve hot'
                    ].join('. ');
                  }
                  
                  return {
                    title: title,
                    description: `A delicious recipe created from the ingredients in your fridge. This dish combines fresh flavors and proper cooking techniques for a satisfying meal.`,
                    prepTime: `${Math.floor(Math.random() * 15) + 10} mins`,
                    difficulty: `Level ${Math.floor(Math.random() * 3) + 1}`,
                    serves: `${Math.floor(Math.random() * 3) + 2}-${Math.floor(Math.random() * 2) + 4}`,
                    ingredients: ingredients.map(ing => `${Math.floor(Math.random() * 2) + 1} ${ing}`),
                    instructions: instructions
                  };
                };

                const detailedRecipe = generateDetailedRecipe(title, foodItems);
                
                const minimalRecipe = {
                  containsfood: true,
                  fooditems: foodItems,
                  recipe: detailedRecipe
                };
                
                console.log('Created detailed recipe:', minimalRecipe);
                recipeObj = minimalRecipe;
              } else {
                throw new Error('No food items found in output');
              }
            } catch (finalError) {
              console.error('Final fallback failed:', finalError);
              setError('Unable to generate recipe. Please try again with a different image.');
              setLoading(false);
              return;
            }
          }
        }
      }

      setRecipeData(recipeObj);

      if (!recipeObj.containsfood || !recipeObj.fooditems?.length) {
        throw new Error('No food ingredients detected in the image');
      }

      // Step 2: Generate an image of the recipe
      const ingredients = recipeObj.fooditems.join(" ");
      const imagePrompt = `A photorealistic photo of a ${recipeObj.recipe.title} with ${ingredients}`;
      
      const imageResponse = await fetch("/api/image_predictions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: imagePrompt,
        }),
      });

      let outputImage = await imageResponse.json();
      if (imageResponse.status !== 201) {
        throw new Error(outputImage.error || 'Failed to create image prediction');
      }

      // Wait for the image generation to complete
      while (outputImage.status !== "succeeded" && outputImage.status !== "failed") {
        await sleep(1000);
        const response = await fetch("/api/image_predictions/" + outputImage.id);
        outputImage = await response.json();
        if (response.status !== 200) {
          throw new Error(outputImage.error || 'Failed to fetch image prediction');
        }
      }

      if (outputImage.status === 'failed') {
        throw new Error('Image generation failed');
      }

      setOutputImage(outputImage);

    } catch (error) {
      console.error('Error in handleSubmit:', error);
      alert(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedImage(null);
    setRecipeData(null);
    setOutputImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (imageRef.current) {
      imageRef.current.src = '';
    }
  };

  const goBackToHome = () => {
    setSelectedImage(null);
    setRecipeData(null);
    setOutputImage(null);
    setLoading(false);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (imageRef.current) {
      imageRef.current.src = '';
    }
    // Scroll to top of page
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-white">
      <Head>
        <title>CulinAI - Turn Your Fridge Into Delicious Recipes</title>
        <meta name="description" content="Upload a photo of your fridge and get AI-generated recipes using the ingredients you have!" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <style jsx global>{`
          body {
            font-family: 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
          }
        `}</style>
      </Head>

      {/* Header */}
      <header className={`sticky top-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white border-b border-gray-200 py-6 shadow-sm' 
          : 'bg-white border-b border-gray-200 py-12 shadow-sm'
      }`}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex justify-between items-center">
            <nav className="flex space-x-12 text-base text-gray-700 font-medium">
              <button onClick={goBackToHome} className="hover:text-gray-900 transition-colors">Home</button>
              <button className="hover:text-gray-900 transition-colors">Explore</button>
              <button className="hover:text-gray-900 transition-colors">Saved</button>
            </nav>
            
            {/* Centered Logo - Always visible */}
            <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center space-x-2">
              <Image 
                src="/CulinAI-logo.png" 
                alt="CulinAI" 
                width={isScrolled ? 70 : 100}
                height={isScrolled ? 70 : 100}
                className={`transition-all duration-300 w-auto ${isScrolled ? 'h-16' : 'h-24'}`}
              />
            </div>
            
            <div className="text-base text-gray-700 font-medium">
              <span>Account</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-yellow-100 via-emerald-100 to-teal-100 py-20">
          <div className="max-w-6xl mx-auto px-6 text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Turn Your Fridge Into<br />
              <span className="text-emerald-600">Delicious Recipes</span>
            </h1>
            <p className="text-xl text-gray-700 mb-8 max-w-3xl mx-auto leading-relaxed">
              Show us a photo of your fridge and we&apos;ll create a delicious recipe for you! Our AI identifies your ingredients and generates personalized recipes instantly. Whether you have leftover vegetables, random proteins, or just want to use what&apos;s available, we&apos;ll turn your ingredients into a mouthwatering meal.
            </p>
            <button 
              onClick={() => uploadSectionRef.current?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-8 py-4 rounded-full text-lg font-semibold hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              Start Cooking
            </button>
          </div>
        </div>

        {/* Main Content Container */}
        <div className="max-w-6xl mx-auto px-6 py-20">
          {/* Recipe Display */}
          {outputImage && recipeData ? (
            <div className="bg-white rounded-2xl shadow-xl p-8 mb-20">
                <div className="text-center mb-8">
                  <h2 className="text-4xl font-bold text-gray-900 mb-4">
                    {recipeData.recipe?.title || recipeData.recipe?.name || "Delicious Recipe"}
                  </h2>
                  <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                    {recipeData.recipe?.description || "A delicious recipe created from the ingredients in your fridge. This dish combines fresh flavors and simple techniques for a satisfying meal."}
                  </p>
                </div>

                {outputImage && (
                  <div className="mb-8 text-center">
                    <div className="bg-gray-50 rounded-lg overflow-hidden inline-block">
                      <img
                        src={typeof outputImage === 'string' ? outputImage : outputImage.output?.[outputImage.output.length - 1] || ''}
                        alt="Generated Recipe"
                        className="max-w-full h-auto rounded-lg max-h-96"
                      />
                    </div>
                  </div>
                )}

              <div className="grid grid-cols-3 gap-6 mb-8">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-emerald-600 mb-2">
                    {recipeData.recipe?.cookingtime || recipeData.recipe?.prepTime || '25'}
                  </div>
                  <div className="text-gray-600">mins</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-teal-600 mb-2">
                    {recipeData.recipe?.difficulty || '3'}
                  </div>
                  <div className="text-gray-600">difficulty</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600 mb-2">
                    {recipeData.recipe?.serves || '2-4'}
                  </div>
                  <div className="text-gray-600">serves</div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-8 mb-8">
                <div>
                  <h3 className="text-2xl font-semibold text-gray-900 mb-4">Ingredients</h3>
                  <ul className="space-y-2">
                    {recipeData.recipe?.ingredients?.map((ingredient: string, index: number) => (
                      <li key={index} className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                        <span className="text-gray-700">{ingredient}</span>
                      </li>
                    )) || recipeData.fooditems?.map((item: string, index: number) => (
                      <li key={index} className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                        <span className="text-gray-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-2xl font-semibold text-gray-900 mb-4">Instructions</h3>
                  <div className="space-y-4">
                    {recipeData.recipe?.instructions?.split('. ').filter((step: string) => step.trim().length > 10).map((step: string, index: number) => (
                      <div key={index} className="flex items-start space-x-4">
                        <div className="flex-shrink-0 w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                          <span className="text-emerald-600 font-semibold text-sm">{index + 1}</span>
                        </div>
                        <p className="text-gray-700 leading-relaxed">{step.trim()}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="text-center">
                <button 
                  onClick={goBackToHome}
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-8 py-4 rounded-full text-lg font-semibold hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                >
                  Back to Home
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* How It Works Section */}
              <div className="text-center mb-20">
                <h2 className="text-4xl font-bold text-gray-900 mb-6">
                  How It <span className="text-emerald-600">Works</span>
                </h2>
                <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto">
                  Transform your ingredients into amazing recipes in just a few simple steps:
                </p>
                
                <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Upload Photo</h3>
                    <p className="text-gray-600">Take a photo of your fridge or ingredients</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">AI Analysis</h3>
                    <p className="text-gray-600">Our AI identifies all your ingredients</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Get Recipe</h3>
                    <p className="text-gray-600">Receive a personalized recipe instantly</p>
                  </div>
                </div>
              </div>

              {/* Difficulty Levels Explanation */}
              <div className="mt-32 bg-white rounded-lg border border-gray-200 p-8 -mx-12">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Understanding <span className="text-teal-600">Difficulty Levels</span>
                </h3>
                <p className="text-gray-600 mb-6">
                  Each recipe comes with a difficulty rating to help you choose the perfect dish for your cooking experience level.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-5 gap-8 max-w-none justify-items-center">
                  <div className="text-center p-6 bg-yellow-50 rounded-lg border border-yellow-200 min-h-[200px] min-w-[180px] flex flex-col justify-center">
                    <div className="text-xl font-bold text-yellow-600 mb-2">1</div>
                    <h4 className="font-semibold text-gray-900 mb-2 text-sm">Beginner</h4>
                    <p className="text-xs text-gray-600 leading-relaxed">No cooking experience needed. Simple steps, basic techniques.</p>
                  </div>
                  
                  <div className="text-center p-6 bg-lime-50 rounded-lg border border-lime-200 min-h-[200px] min-w-[180px] flex flex-col justify-center">
                    <div className="text-xl font-bold text-lime-600 mb-2">2</div>
                    <h4 className="font-semibold text-gray-900 mb-2 text-sm">Easy</h4>
                    <p className="text-xs text-gray-600 leading-relaxed">Basic cooking knowledge. Simple chopping, stirring, basic timing.</p>
                  </div>
                  
                  <div className="text-center p-6 bg-emerald-50 rounded-lg border border-emerald-200 min-h-[200px] min-w-[180px] flex flex-col justify-center">
                    <div className="text-xl font-bold text-emerald-600 mb-2">3</div>
                    <h4 className="font-semibold text-gray-900 mb-2 text-sm">Intermediate</h4>
                    <p className="text-xs text-gray-600 leading-relaxed">Some cooking experience. Knife skills, temperature control, multi-step processes.</p>
                  </div>
                  
                  <div className="text-center p-6 bg-cyan-50 rounded-lg border border-cyan-200 min-h-[200px] min-w-[180px] flex flex-col justify-center">
                    <div className="text-xl font-bold text-cyan-600 mb-2">4</div>
                    <h4 className="font-semibold text-gray-900 mb-2 text-sm">Advanced</h4>
                    <p className="text-xs text-gray-600 leading-relaxed">Good cooking skills. Complex techniques, precise timing, ingredient balancing.</p>
                  </div>
                  
                  <div className="text-center p-6 bg-blue-50 rounded-lg border border-blue-200 min-h-[200px] min-w-[180px] flex flex-col justify-center">
                    <div className="text-xl font-bold text-blue-600 mb-2">5</div>
                    <h4 className="font-semibold text-gray-900 mb-2 text-sm">Expert</h4>
                    <p className="text-xs text-gray-600 leading-relaxed">Professional-level skills. Advanced techniques, artistic presentation, complex flavor profiles.</p>
                  </div>
                </div>
                
                <div className="mt-6 text-center">
                  <p className="text-sm text-gray-600">
                    <strong>Pro tip:</strong> Start with level 1-2 if you&apos;re new to cooking, and work your way up as you gain confidence!
                  </p>
                </div>
              </div>

              {/* Upload Section */}
              <div ref={uploadSectionRef} className="mt-20 text-center">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Upload Your Fridge Photo</h2>
                <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                  Upload the photo below and we will generate a recipe for you that uses the ingredients provided!
                </p>
                
                <div className="max-w-2xl mx-auto">
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-50 transition-all duration-300"
                  >
                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    <p className="text-lg text-gray-600 mb-2">Click to upload or drag and drop</p>
                    <p className="text-sm text-gray-500">PNG, JPG, GIF up to 10MB</p>
                  </div>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  
                  {selectedImage && (
                    <div className="mt-8">
                      <div className="relative inline-block">
                        <img
                          ref={imageRef}
                          src={selectedImage || ''}
                          alt="Selected"
                          className="max-w-full h-auto rounded-lg shadow-lg max-h-96"
                        />
                        <button
                          onClick={() => setSelectedImage(null)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
                        >
                          ×
                        </button>
                      </div>
                      <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="mt-6 bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-8 py-4 rounded-full text-lg font-semibold hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                      >
                        {loading ? 'Generating Recipe...' : 'Generate Recipe'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-12">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex items-center space-x-3">
              <Image 
                src="/CulinAI-logo.png" 
                alt="CulinAI" 
                width={80}
                height={80}
                className="h-20 w-auto"
              />
              <div>
                <p className="text-gray-300">Made with ❤️ for food lovers everywhere</p>
              </div>
            </div>
            
            <div className="text-center">
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <div className="space-y-2">
                <p className="text-gray-300 hover:text-white cursor-pointer">Home</p>
                <p className="text-gray-300 hover:text-white cursor-pointer">Explore</p>
                <p className="text-gray-300 hover:text-white cursor-pointer">Saved Recipes</p>
              </div>
            </div>
            
            <div className="text-center">
              <h4 className="font-semibold mb-4">Connect</h4>
              <div className="space-y-2">
                <p className="text-gray-300 hover:text-white cursor-pointer">Contact Us</p>
                <p className="text-gray-300 hover:text-white cursor-pointer">Privacy Policy</p>
                <p className="text-gray-300 hover:text-white cursor-pointer">Terms of Service</p>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-700 mt-8 pt-8 text-center">
            <p className="text-gray-400">&copy; 2025 CulinAI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
} 
