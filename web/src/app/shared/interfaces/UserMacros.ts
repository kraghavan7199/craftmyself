import { Timestamp } from "@angular/fire/firestore";

export interface UserMacros {
        id: string
        userId: string;
        date: Timestamp;
        macros: Macros[];
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