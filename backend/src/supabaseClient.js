"use strict";
/**
 * supabaseClient.ts
 *
 * Inicializa el cliente de Supabase para el backend (Node.js)
 * usando la Service Role Key. ⚠️ ¡Nunca uses esta clave en el frontend!
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.supabase = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in environment variables.');
    process.exit(1);
}
// Creamos una instancia de cliente Supabase para el backend
exports.supabase = (0, supabase_js_1.createClient)(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: {
        persistSession: false,
    },
});
exports.default = exports.supabase;
//# sourceMappingURL=supabaseClient.js.map