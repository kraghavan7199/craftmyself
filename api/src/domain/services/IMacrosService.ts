import { UserMacros } from "../models/UserMacros";

export interface IMacrosService {
    upsertMacros(macros: UserMacros): Promise<string>
}