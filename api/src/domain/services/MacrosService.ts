import { inject, injectable } from "inversify";
import { PostgresRepository } from "../../repository/postgres.repository";
import TYPES from "../../config/types";
import { UserMacros } from "../models/UserMacros";
import { v4 as uuidv4 } from 'uuid';
import { IMacrosService } from "./IMacrosService";

@injectable()
export class MacrosService implements IMacrosService {
    postgresRepo!: PostgresRepository;
      constructor(@inject(TYPES.PostgresRepository) postgresRepo: PostgresRepository) {
        this.postgresRepo = postgresRepo;
    }

     async upsertMacros(macros: UserMacros) { 
        const updatedUserMacros = this.prepareUserMacros(macros)
        return await this.postgresRepo.upsertMacros(updatedUserMacros);
     }

     private prepareUserMacros(userMacroDetails: UserMacros) {
        const macroTotals = { kcal: 0, protein_g: 0, carbs_g: 0, fats_g: 0 };
        userMacroDetails.macros.forEach(macro => {
             macroTotals.kcal += +macro.kcal;
                macroTotals.protein_g += +macro.protein_g;
                macroTotals.carbs_g += +macro.carbs_g;
                macroTotals.fats_g += +macro.fats_g;
        });

        userMacroDetails.totals = macroTotals;
        userMacroDetails.id = userMacroDetails.id || uuidv4();
        return userMacroDetails;
    }
}