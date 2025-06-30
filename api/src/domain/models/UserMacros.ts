


export interface UserMacros {
    id: string
    userId: string;
    date: Date;
    macros: Macros[];
    totals?: MacroAttributes
}

export interface Macros {
    carbs_g: number;
    fats_g: number;
    food_item: string;
    id: string;
    kcal: number;
    protein_g: number;
    quantity: number;
}

export interface MacroAttributes {
    carbs_g: number;
    fats_g: number;
    kcal: number;
    protein_g: number;
}