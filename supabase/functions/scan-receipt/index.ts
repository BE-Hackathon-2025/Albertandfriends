import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
const aiGatewayUrl = 'https://ai.gateway.lovable.dev/v1/chat/completions';

async function extractItemsFromReceipt(base64Image: string): Promise<string[]> {
  const response = await fetch(aiGatewayUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${lovableApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        {
          role: 'user',
          content: [
            { 
              type: 'text', 
              text: 'Extract all food items from this grocery receipt. List each item on a new line. Only include actual food products, not store names, prices, or other receipt details.' 
            },
            { 
              type: 'image_url', 
              image_url: { url: base64Image } 
            }
          ]
        }
      ]
    })
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('AI API error:', error);
    throw new Error('Failed to extract items from receipt');
  }

  const data = await response.json();
  const itemsText = data.choices[0].message.content.trim();
  
  // Split by newlines and clean up
  return itemsText
    .split('\n')
    .map((item: string) => item.trim().replace(/^[-*•\d.)\s]+/, ''))
    .filter((item: string) => item.length > 2);
}

async function generateRecipes(items: string[]) {
  const itemsList = items.join(', ');
  
  const response = await fetch(aiGatewayUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${lovableApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        {
          role: 'user',
          content: `I have these ingredients: ${itemsList}

Generate 3 simple recipes I can make with these ingredients. For each recipe, provide:
- Name
- Description (one sentence)
- Ingredients list with measurements
- Step-by-step cooking instructions
- Approximate nutrition info (calories, protein, carbs, fat)

Format each recipe clearly.`
        }
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "generate_recipes",
            description: "Generate recipe suggestions based on available ingredients",
            parameters: {
              type: "object",
              properties: {
                recipes: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string", description: "Recipe name" },
                      description: { type: "string", description: "Brief description" },
                      ingredients: { 
                        type: "array", 
                        items: { type: "string" },
                        description: "List of ingredients with amounts"
                      },
                      instructions: { 
                        type: "array", 
                        items: { type: "string" },
                        description: "Step by step instructions"
                      },
                      nutrition: { 
                        type: "string", 
                        description: "Nutrition information (calories, protein, carbs, fat)"
                      }
                    },
                    required: ["name", "description", "ingredients", "instructions"]
                  }
                }
              },
              required: ["recipes"]
            }
          }
        }
      ],
      tool_choice: { type: "function", function: { name: "generate_recipes" } }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Recipe generation error:', errorText);
    throw new Error('Failed to generate recipes');
  }

  const data = await response.json();
  
  // Extract from tool call
  const toolCall = data.choices[0].message.tool_calls?.[0];
  if (!toolCall) {
    console.error('No tool call in response:', JSON.stringify(data));
    throw new Error('No recipes generated');
  }
  
  const result = JSON.parse(toolCall.function.arguments);
  return result.recipes || [];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!lovableApiKey) {
      throw new Error('Lovable API key not configured');
    }

    const { image } = await req.json();
    
    if (!image) {
      throw new Error('No image provided');
    }

    console.log('Extracting items from receipt...');
    const items = await extractItemsFromReceipt(image);
    console.log('Found items:', items);

    if (items.length === 0) {
      throw new Error('No food items found on receipt');
    }

    console.log('Generating recipes...');
    const recipes = await generateRecipes(items);
    console.log('Generated recipes:', recipes.length);

    return new Response(
      JSON.stringify({ items, recipes }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        items: [],
        recipes: []
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
