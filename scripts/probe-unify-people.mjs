/**
 * Show the enrichable Unify person records at a presentable, low-sensitivity level:
 * name, title, company, linkedin presence, opt-out flags, and a MASKED email
 * (local part truncated). No full emails / phones are printed.
 */
import { readFileSync } from "node:fs";
function loadEnv(p){const o={};try{for(const l of readFileSync(p,"utf8").split("\n")){const m=l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);if(m)o[m[1]]=m[2].replace(/^["']|["']$/g,"");}}catch{}return o;}
const KEY=(loadEnv(new URL("../.env",import.meta.url).pathname).UNIFY_API_KEY||"").trim();
const BASE="https://api.unifygtm.com/data/v1";
const r=await fetch(`${BASE}/objects/person/records`,{headers:{"X-Api-Key":KEY,Accept:"application/json"}});
const data=(await r.json())?.data??[];
function maskEmail(e){if(!e||typeof e!=="string"||!e.includes("@"))return "(none)";const [l,d]=e.split("@");return `${l.slice(0,2)}***@${d}`;}
console.log(`person records: ${data.length}\n`);
for(const rec of data){
  const a=rec.attributes??{};
  console.log(`• ${a.first_name??"?"} ${a.last_name??""}`.trim());
  console.log(`    title:   ${a.title??"—"}`);
  console.log(`    company: ${a.company??"—"}`);
  console.log(`    email:   ${maskEmail(a.email)}   linkedin: ${a.linkedin_url?"yes":"no"}`);
  console.log(`    opt-out: do_not_email=${a.do_not_email??"—"} email_opt_out=${a.email_opt_out??"—"} do_not_call=${a.do_not_call??"—"} eu_resident=${a.eu_resident??"—"}`);
  console.log(`    source:  ${a.lead_source??"—"}   last_activity: ${a.last_activity_at??"—"}   id: ${rec.id}`);
  console.log("");
}
