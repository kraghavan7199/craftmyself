
export const workoutAnalysisPrompt = `Analyze the provided diet data, which is structured as a collection of documents, where each document represents a single day's food intake. Each document is named by date and contains a timestamp.

Within each document, there's a 'macros' array. Each element in this array is a map representing a consumed food item and includes the following fields:
- 'carbs_g': Carbohydrates in grams (can be string or number)
- 'fats_g': Fats in grams (can be string or number)
- 'food_item': Name of the food item (string)
- 'id': A unique identifier for the food item (string)
- 'kcal': Calories (can be string or number)
- 'notes': Additional notes about the food item (string)
- 'protein_g': Protein in grams (can be string or number)
- 'quantity': Quantity of the food item consumed (number)

Each daily document also contains:
- 'macrosId': An identifier for the set of macros for that day (string).
- 'totals': A map containing the sum of 'carbs_g', 'fats_g', 'kcal', and 'protein_g' for the entire day.
- 'userId': An identifier for the user (string).

Based on this data structure, please perform the following analysis and return a JSON object with::


**Descriptive Statistics (for a given period, e.g., daily, weekly, monthly averages):**
    * Average daily, weekly, and monthly intake of calories, carbohydrates, fats, and protein.
    * Distribution of calories from carbohydrates, fats, and protein.
    * Identify the top N most frequently consumed food items.
    * Identify the top N food items contributing the most to calorie/macro intake.

**Trend Analysis (if multiple days/weeks of data are provided):**
    * Trends in daily calorie and macronutrient intake over time.
    * Changes in consumption patterns of specific food items or food categories.

**Insights and Recommendations **
    * Identify days with particularly high or low intake of certain nutrients.
    * Compare the average intake to general dietary recommendations (if provided or if general knowledge is to be used, specify this).
    * Suggest potential areas for improvement (e.g., increasing protein, reducing sugar if identifiable from food items).
    * Analyze the variety in the diet.
**User's Macros  Data:**
{{text}}

Respond only with valid JSON, e.g.:

\`\`\`json
{
  "statsticalAnalysis": [An array of strings describing the analysis. Dont include words like "The user" use "You" instead.. Use date instead ps the date is in Firestore timestamp format so convert it like May 15 2025.],
  "trendAnalysis": [An array of strings describing the analysis. Dont include words like "The user" use "You" instead.. Use date instead ps the date is in Firestore timestamp format so convert it like May 15 2025.],
  "insights": [an array of strings with high-level insights .  Dont include words like "The user" use "You" instead.. Use date instead ps the date is in Firestore timestamp format so convert it like May 15 2025.]
}
\`\`\`

Ensure the JSON is well-formed and strictly adheres to this schema.
`;