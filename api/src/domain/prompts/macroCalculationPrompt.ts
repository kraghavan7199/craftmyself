export const macroCalculationPrompt = `Analyze the following text describing food items consumed and return a JSON array containing the estimated macronutrient information for each item. Each object in the array should include the food item, calories (kcal), protein (g), carbohydrates (g), and fats (g).

If a specific food item cannot be identified or its macronutrient information is not readily available, include the item in the JSON array with null or "N/A" values for the macronutrient fields and add a note indicating this.

Prioritize accuracy in identifying the food items and their corresponding macronutrient values. If multiple interpretations of a food item are possible, use the most common or likely interpretation.

Input Text:
"{{text}}"

Expected JSON Output Format:
[
  {
    "id": (timestamp+ food_item + randomNumber)trim and remove spaces,
    "food_item": "egg",
    "quantity": 5,
    "kcal": "value",
    "protein_g": "value",
    "carbs_g": "value",
    "fats_g": "value",
    "notes": "" // Optional: Add notes if any ambiguity or unavailability
  },
  {
    "id":(timestamp+ food_item + randomNumber)trim and remove spaces,
    "food_item": "chicken maharaja mac",
    "quantity": 1,
    "kcal": "value",
    "protein_g": "value",
    "carbs_g": "value",
    "fats_g": "value",
    "notes": "" // Optional: Add notes if any ambiguity or unavailability
  }
]

Provide the JSON array for the input text. give me the total values . meaning whatever the quantity is, multiply it with the values and give me the total values. I am not interested in the individual values. so if i have 5 eggs, give me the kcal, protein, carbs and fats for 5 eggs.`;

 