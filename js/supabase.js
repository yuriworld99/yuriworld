const SUPABASE_URL = "https://ifgattjcckprijvpfypw.supabase.co";
const SUPABASE_KEY = "sb_publishable_JG7AQQ_tTJJ6SNKVjU50PQ_VNxlzTim";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const scriptLayout = document.createElement("script");
scriptLayout.src = "js/layout.js?v=1";
document.head.appendChild(scriptLayout);
